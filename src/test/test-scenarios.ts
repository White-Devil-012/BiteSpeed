// Test scenarios for manual testing
// Run: npm run dev, then use these curl commands

export const testScenarios = [
  {
    name: "Scenario 1: New customer",
    description: "Creating a new primary contact",
    request: {
      email: "lorraine@hillvalley.edu",
      phoneNumber: "123456"
    },
    expectedResponse: {
      contact: {
        primaryContatctId: 1,
        emails: ["lorraine@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: []
      }
    },
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'`
  },
  {
    name: "Scenario 2: Linking existing contact",
    description: "Adding new email to existing phone number",
    request: {
      email: "mcfly@hillvalley.edu",
      phoneNumber: "123456"
    },
    expectedResponse: {
      contact: {
        primaryContatctId: 1,
        emails: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: [2]
      }
    },
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'`
  },
  {
    name: "Scenario 3: Same request returns same result",
    description: "Duplicate request should return same consolidated result",
    request: {
      email: "mcfly@hillvalley.edu",
      phoneNumber: "123456"
    },
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'`
  },
  {
    name: "Scenario 4: Email only request",
    description: "Request with only email should return consolidated result",
    request: {
      email: "lorraine@hillvalley.edu"
    },
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"lorraine@hillvalley.edu"}'`
  },
  {
    name: "Scenario 5: Phone only request",
    description: "Request with only phone should return consolidated result",
    request: {
      phoneNumber: "123456"
    },
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"phoneNumber":"123456"}'`
  },
  {
    name: "Scenario 6: Primary contact merging - Setup",
    description: "Create two separate primary contacts",
    requests: [
      {
        email: "george@hillvalley.edu",
        phoneNumber: "919191"
      },
      {
        email: "biffsucks@hillvalley.edu",
        phoneNumber: "717171"
      }
    ],
    curlCommands: [
      `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"george@hillvalley.edu","phoneNumber":"919191"}'`,
      `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"biffsucks@hillvalley.edu","phoneNumber":"717171"}'`
    ]
  },
  {
    name: "Scenario 7: Primary contact merging - Trigger",
    description: "Link the two primary contacts",
    request: {
      email: "george@hillvalley.edu",
      phoneNumber: "717171"
    },
    expectedResponse: {
      contact: {
        primaryContatctId: 3, // Assuming george was created first
        emails: ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
        phoneNumbers: ["919191", "717171"],
        secondaryContactIds: [4]
      }
    },
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"george@hillvalley.edu","phoneNumber":"717171"}'`
  }
];

// Validation test cases
export const validationTests = [
  {
    name: "Empty request",
    request: {},
    expectedStatus: 400,
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{}'`
  },
  {
    name: "Invalid email type",
    request: {
      email: 123,
      phoneNumber: "123456"
    },
    expectedStatus: 400,
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":123,"phoneNumber":"123456"}'`
  },
  {
    name: "Invalid phone type",
    request: {
      email: "test@example.com",
      phoneNumber: 123456
    },
    expectedStatus: 400,
    curlCommand: `curl -X POST http://localhost:3000/identify -H "Content-Type: application/json" -d '{"email":"test@example.com","phoneNumber":123456}'`
  }
];

console.log("Test Scenarios for Bitespeed Identity Reconciliation");
console.log("=".repeat(60));
console.log("\nTo test the implementation:");
console.log("1. Start the server: npm run dev");
console.log("2. Run the curl commands below in order");
console.log("3. Check the responses match expected results\n");

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  if (scenario.curlCommand) {
    console.log(`   ${scenario.curlCommand}`);
  } else if (scenario.curlCommands) {
    scenario.curlCommands.forEach((cmd, i) => {
      console.log(`   ${cmd}`);
    });
  }
  console.log();
});

console.log("\nValidation Tests:");
console.log("-".repeat(30));
validationTests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name} (Expected: ${test.expectedStatus})`);
  console.log(`   ${test.curlCommand}`);
  console.log();
});
