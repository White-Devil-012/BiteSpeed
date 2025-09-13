import { Database } from "../database/Database";
import { Contact, IdentifyRequest, IdentifyResponse } from "../types/Contact";

export class IdentityService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  public async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // Find existing contacts with matching email or phone
    const existingContacts = await this.db.findContactsByEmailOrPhone(
      email,
      phoneNumber
    );

    if (existingContacts.length === 0) {
      // No existing contacts - create new primary contact
      const newContact = await this.db.createContact(
        phoneNumber || null,
        email || null,
        null,
        "primary"
      );

      return this.buildResponse([newContact]);
    }

    // For simplicity, just work with the existing contacts we found
    // Check if we need to create a new secondary contact
    const needsNewContact = this.shouldCreateNewContact(
      existingContacts,
      email,
      phoneNumber
    );

    if (needsNewContact) {
      // Find the primary contact to link to
      const primaryContact = this.findPrimaryContact(existingContacts);

      // Create new secondary contact
      const newContact = await this.db.createContact(
        phoneNumber || null,
        email || null,
        primaryContact.id,
        "secondary"
      );

      existingContacts.push(newContact);
    }

    // Handle the case where two separate primary contacts need to be linked
    await this.handlePrimaryContactMerging(
      existingContacts,
      email,
      phoneNumber
    );

    return this.buildResponse(existingContacts);
  }

  private shouldCreateNewContact(
    contacts: Contact[],
    email?: string,
    phoneNumber?: string
  ): boolean {
    // Check if the exact combination of email and phone already exists
    const exactMatch = contacts.find((contact) => {
      const emailMatch = (!email && !contact.email) || contact.email === email;
      const phoneMatch =
        (!phoneNumber && !contact.phoneNumber) ||
        contact.phoneNumber === phoneNumber;
      return emailMatch && phoneMatch;
    });

    if (exactMatch) {
      return false; // Exact match found, no need for new contact
    }

    // Check if we have new information (email or phone not seen before)
    const hasNewEmail = !!email && !contacts.some((c) => c.email === email);
    const hasNewPhone =
      !!phoneNumber && !contacts.some((c) => c.phoneNumber === phoneNumber);

    return hasNewEmail || hasNewPhone;
  }

  private async handlePrimaryContactMerging(
    contacts: Contact[],
    email?: string,
    phoneNumber?: string
  ): Promise<void> {
    // Find all primary contacts that match the request
    const matchingPrimaries = contacts.filter((contact) => {
      if (contact.linkPrecedence !== "primary") return false;

      const emailMatch = email && contact.email === email;
      const phoneMatch = phoneNumber && contact.phoneNumber === phoneNumber;

      return emailMatch || phoneMatch;
    });

    if (matchingPrimaries.length > 1) {
      // Sort by creation date to find the oldest (which should remain primary)
      matchingPrimaries.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      const primaryToKeep = matchingPrimaries[0];
      const primariesToConvert = matchingPrimaries.slice(1);

      // Convert newer primaries to secondaries
      for (const contact of primariesToConvert) {
        await this.db.updateContact(contact.id, {
          linkedId: primaryToKeep.id,
          linkPrecedence: "secondary",
        });

        // Update any contacts that were linked to this former primary
        const linkedToFormerPrimary = contacts.filter(
          (c) => c.linkedId === contact.id
        );
        for (const linked of linkedToFormerPrimary) {
          await this.db.updateContact(linked.id, {
            linkedId: primaryToKeep.id,
          });
        }
      }
    }
  }

  private findPrimaryContact(contacts: Contact[]): Contact {
    const primaries = contacts.filter((c) => c.linkPrecedence === "primary");

    if (primaries.length === 0) {
      throw new Error("No primary contact found in linked contacts");
    }

    // Return the oldest primary contact
    return primaries.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0];
  }

  private buildResponse(contacts: Contact[]): IdentifyResponse {
    const primaryContact = this.findPrimaryContact(contacts);
    const secondaryContacts = contacts.filter(
      (c) => c.linkPrecedence === "secondary"
    );

    // Collect all unique emails and phone numbers
    const allEmails = [
      ...new Set(
        contacts.map((c) => c.email).filter((email) => email !== null)
      ),
    ] as string[];

    const allPhoneNumbers = [
      ...new Set(
        contacts.map((c) => c.phoneNumber).filter((phone) => phone !== null)
      ),
    ] as string[];

    // Sort to ensure primary contact's info comes first
    const sortedEmails = this.sortContactInfo(
      allEmails,
      contacts,
      "email",
      primaryContact
    );
    const sortedPhoneNumbers = this.sortContactInfo(
      allPhoneNumbers,
      contacts,
      "phoneNumber",
      primaryContact
    );

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails: sortedEmails,
        phoneNumbers: sortedPhoneNumbers,
        secondaryContactIds: secondaryContacts
          .map((c) => c.id)
          .sort((a, b) => a - b),
      },
    };
  }

  private sortContactInfo(
    items: string[],
    contacts: Contact[],
    field: "email" | "phoneNumber",
    primaryContact: Contact
  ): string[] {
    const primaryValue = primaryContact[field];
    const result: string[] = [];

    // Add primary contact's value first (if it exists)
    if (primaryValue && items.includes(primaryValue)) {
      result.push(primaryValue);
    }

    // Add remaining values in order of contact creation
    const remainingItems = items.filter((item) => item !== primaryValue);
    const sortedContacts = contacts
      .filter((c) => c[field] && remainingItems.includes(c[field] as string))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const contact of sortedContacts) {
      const value = contact[field] as string;
      if (!result.includes(value)) {
        result.push(value);
      }
    }

    return result;
  }
}
