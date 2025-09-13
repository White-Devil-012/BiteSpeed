import sqlite3 from "sqlite3";
import { Contact } from "../types/Contact";

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = "./contacts.db") {
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES contacts (id)
      )
    `;

    this.db.run(createTableSQL, (err) => {
      if (err) {
        console.error("Error creating contacts table:", err);
      } else {
        console.log("Contacts table created or already exists");
      }
    });
  }

  public async findContactsByEmailOrPhone(
    email?: string,
    phoneNumber?: string
  ): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM contacts WHERE deletedAt IS NULL AND (";
      const params: string[] = [];

      if (email) {
        query += "email = ?";
        params.push(email);
      }

      if (phoneNumber) {
        if (email) query += " OR ";
        query += "phoneNumber = ?";
        params.push(phoneNumber);
      }

      query += ")";

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const contacts = rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
          }));
          resolve(contacts);
        }
      });
    });
  }

  public async getAllLinkedContacts(contactIds: number[]): Promise<Contact[]> {
    if (contactIds.length === 0) return [];

    return new Promise((resolve, reject) => {
      const placeholders = contactIds.map(() => "?").join(",");
      const query = `
        SELECT DISTINCT * FROM contacts 
        WHERE deletedAt IS NULL AND (
          id IN (${placeholders}) OR 
          linkedId IN (${placeholders}) OR
          id IN (SELECT linkedId FROM contacts WHERE id IN (${placeholders}) AND linkedId IS NOT NULL)
        )
        ORDER BY createdAt ASC
      `;

      const params = [...contactIds, ...contactIds, ...contactIds];

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const contacts = rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
          }));
          resolve(contacts);
        }
      });
    });
  }

  public async createContact(
    phoneNumber: string | null,
    email: string | null,
    linkedId: number | null,
    linkPrecedence: "primary" | "secondary"
  ): Promise<Contact> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO contacts (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const db = this.db;

      db.run(
        query,
        [phoneNumber, email, linkedId, linkPrecedence],
        function (err) {
          if (err) {
            reject(err);
          } else {
            const selectQuery = "SELECT * FROM contacts WHERE id = ?";
            const insertId = this.lastID;

            db.get(selectQuery, [insertId], (err: any, row: any) => {
              if (err) {
                reject(err);
              } else {
                const contact: Contact = {
                  ...row,
                  createdAt: new Date(row.createdAt),
                  updatedAt: new Date(row.updatedAt),
                  deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
                };
                resolve(contact);
              }
            });
          }
        }
      );
    });
  }

  public async updateContact(
    id: number,
    updates: Partial<Contact>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).filter((key) => key !== "id");
      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => (updates as any)[field]);

      const query = `
        UPDATE contacts 
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      this.db.run(query, [...values, id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public close(): void {
    this.db.close();
  }
}
