const { getDb, all } = require("./database/db");

async function test() {
  try {
    const db = await getDb();
    const info = all(db, "PRAGMA table_info(employees)");
    console.log("Employees columns:", info.map(c => `${c.name} (${c.type})` + (c.notnull ? ' NOT NULL' : '')));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
