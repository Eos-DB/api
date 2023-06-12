import { Client } from "@notionhq/client";
import { config } from "dotenv";
config();

// Connection to Notion with token in .env
const notion = new Client({
    auth: process.env.NOTION_TOKEN_KEY
})

export const createNewDB = async (req, res) => {
    // Soon the value will be req.body don't worry
    const { name, creator, minrole, description, status } =  req.body.content;
    console.log(req.body)

    // it's to generate Token with a length of 64
    function generateToken() {
        const possibilities = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789123456789";
        var result = "secret_";
        for (var i = 0; i < 64; i++) {
            result += possibilities.charAt(Math.floor(Math.random() * possibilities.length));
        }

        return result;
    }

    try {
        // Create a new data base for the user with original row like Name Numero and Other properties
        const newTable = await notion.databases.create({
            parent: { page_id: process.env.USER_DB_ID },
            title: [{ type: 'text', text: { content: name } }],
            properties: {
                Name: { title: {} },
                Numero: { number: {} },
                "Other properties": { rich_text: {} }
            }
        })

        // And we add it in "Tokens bdd" on notion with token and id retrieve on const newTable
        const response = await notion.pages.create({
            parent: { database_id: process.env.TOKENS_TABLE_ID },
            properties: {
                Token: { title: [{ text: { content: generateToken() } }] },
                Id: { rich_text: [{ text: { content: newTable.id } }] },
                Creator: { rich_text: [{ text: { content: creator } }] },
                Name: { rich_text: [{ text: { content: name } }] },
                MinRole: { rich_text: [{ text: { content: minrole } }] },
                Description: { rich_text: [{ text: { content: description } }] },
                Status: { rich_text: [{ text: { content: status } }] }
            }
        })

        res.status(201).json(response)
    } catch (err) {
        res.status(400).json(err)
    }
}

export const addColumn = async (req, res) => {
    // Same here, soon it will be req.body for token and name
    const { token, name } = req.body;

    try {
        // Search the token on the db and if it match we take the id
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        })

        // If no token are find
        if (searchResponse.results.length === 0) {
            res.status(409).json("Erreur, le token n'a pas été trouver")
        }
        // take the id of the user db
        var pageId = searchResponse.results[0].properties.Id.rich_text[0].text.content

        // retrieve properties of the db
        const database = await notion.databases.retrieve({
            database_id: pageId
        })
        // add a properties soon replace rich_text by an option like title number date etc
        database.properties[name] = { rich_text: {} }

        // And we update the db
        await notion.databases.update({
            database_id: pageId,
            properties: database.properties
        })

        res.status(201).json("Column added")
    } catch (err) {
        res.status(400).json(err)
    }
}

export const editRowName = async () => {
    // Destructure the variables from the object
    const { token, currentColumnName, newColumnName } = req.body;

    try {
        // Query the database to find the token
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(409).json("Erreur, le token n'a pas été trouver")
            return;
        }

        // Retrieve the page ID from the search response
        const pageId = searchResponse.results[0].properties.Id.rich_text[0].text.content;
        // Retrieve the database using the page ID
        const database = await notion.databases.retrieve({
            database_id: pageId
        });

        // Find the property to update based on the current column name
        const propertyToUpdate = Object.values(database.properties).find(property => property.name === currentColumnName);
        if (!propertyToUpdate) {
            res.status(400).json("La colonne n'a pas été trouvée.")
            return;
        }

        // Update the name of the property
        propertyToUpdate.name = newColumnName;
        // Update the database with the modified properties
        await notion.databases.update({
            database_id: pageId,
            properties: database.properties
        });
        res.status(201).json("Le nom de colonne a été modifier")
    } catch (err) {
        res.status(400).json(err)
    }
};

export const editColumnProperty = async (req, res) => {
    // Destructure the variables from the object
    const { token, columnName, newProperty } = req.body;

    // Define the possible property configurations
    const propertyPossibilities = {
        text: {
            type: "rich_text",
            rich_text: {}
        },
        number: {
            type: "number",
            number: { format: "number" }
        }
    };

    try {
        // Query the database to find the token
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(409).json("Erreur, le token n'a pas été trouver")
            return;
        }

        // Retrieve the database ID from the search response
        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;

        // Retrieve the database using the database ID
        const database = await notion.databases.retrieve({ database_id: databaseId });

        // Create a new properties object based on the existing properties with the column to be updated removed
        const newProperties = { ...database.properties };
        delete newProperties[columnName];

        // Add the new property configuration to the new properties object with the updated column name
        newProperties[columnName] = { ...propertyPossibilities[newProperty], name: columnName };

        // Update the database with the modified properties
        await notion.databases.update({
            database_id: databaseId,
            properties: newProperties
        });

        res.status(201).json("Propertye edited.")
    } catch (err) {
        res.status(400).json(err)
    }
};

export const deleteColumn = async (req, res) => {
    const { token, columnName } = req.body;

    try {
        // Query the database to find the token
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(409).json("Erreur, le token n'a pas été trouver")
            return;
        }

        const pageId = searchResponse.results[0].id;
        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;

        // Retrieve the database using the database ID
        const database = await notion.databases.retrieve({ database_id: databaseId });

        // Create a new properties object with the column to be deleted removed
        const newProperties = Object.entries(database.properties).reduce((props, [key, value]) => {
            if (key !== columnName) {
                props[key] = value;
            }
            return props;
        }, {});

        // Create a new database without the deleted column
        const newDatabase = await notion.databases.create({
            parent: { page_id: process.env.USER_DB_ID },
            title: [{ type: "text", text: { content: database.title[0].plain_text } }],
            properties: newProperties
        });

        // Update the page referencing the old database to point to the new database
        await notion.pages.update({
            page_id: pageId,
            properties: {
                Id: { rich_text: [{ text: { content: newDatabase.id } }] }
            }
        });

        // Retrieve the data from the old database
        const oldData = await notion.databases.query({
            database_id: databaseId
        });

        // Create new pages in the new database with the updated data
        for (const entry of oldData.results) {
            delete entry.properties[columnName];
            await notion.pages.create({
                parent: { database_id: newDatabase.id },
                properties: entry.properties
            });
        }

        // Archive the old database
        await notion.databases.update({
            database_id: databaseId,
            archived: true
        });

        res.status(201).json({ results: "Column deleted successfully." })
    } catch (err) {
        res.status(201).json({ results: err })
    }
};

export const deleteDB = async (req, res) => {
    const { token } = req.body;

    try {
        // Query the database to find the token
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(400).send({ result: "Le token est invalide" })
            return;
        }

        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;
        const pagesId = searchResponse.results[0].id;

        // Archive the page associated with the database
        await notion.pages.update({
            page_id: pagesId,
            archived: true
        });

        // Archive the database
        await notion.databases.update({
            database_id: databaseId,
            archived: true
        });

        res.status(201).json({ results: "Data base deleted successfully." })
    } catch (err) {
        res.status(400).json({ results: err })
    }
};

export const addContent = async (req, res) => {
    const { token, content } = req.body;

    try {
        // Query the database to find the token
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(400).send({ result: "Le token est invalide" })
            return;
        }

        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;

        // Retrieve the user's database
        const userDb = await notion.databases.retrieve({
            database_id: databaseId
        });

        // Define property manipulators for different property types
        const propertyManipulators = {
            title: (content) => ({ title: [{ text: { content } }] }),
            rich_text: (content) => ({ rich_text: [{ text: { content } }] }),
            number: (content) => ({ number: content }),
            date: (content) => ({ date: { start: content, end: content } }),
            formula: (content) => ({ formula: { expression: content } }),
            email: (content) => ({ email: content })
        };

        // Create newContent object by manipulating properties
        const newContent = Object.entries(content).reduce((acc, [key, value]) => {
            const propertyExists = userDb.properties.hasOwnProperty(key);
            if (propertyExists) {
                const propertyType = userDb.properties[key].type;
                const manipulateProperty = propertyManipulators[propertyType];
                acc[key] = manipulateProperty ? manipulateProperty(value) : value;
            }
            return acc;
        }, {});

        // Create a new page with the new content
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: newContent
        });

        res.status(201).json("Content added")
    } catch (err) {
        res.status(400).json("Token is invalid")
    }
};

export const deleteContent = async (req, res) => {
    const { token, pageId } = req.body;

    try {
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(400).send({ result: "Le token est invalide" })
            return;
        }

        await notion.pages.update({
            page_id: pageId,
            archived: true
        });

        res.status(201).send({ results:  "Page supprimée avec succès"})
    } catch (error) {
        res.status(201).send({ results:  error})
    }
}

export const queryDb = async (req, res) => {
    const { token } = req.body;

    try {
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(400).send({ result: "Le token est invalide" })
            return;
        }

        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;

        const querying = await notion.databases.query({
            database_id: databaseId
        })

        var queryResult = []

        for (const nbr in querying.results) {
            var datas = querying.results[nbr].properties
            datas["_id"] = querying.results[nbr].id
            queryResult.push(datas)
        }
    
        res.status(201).send({ results: queryResult})
    } catch (err) {
        res.status(400).send({ results: err})
    }
}

export const editContent = async (req, res) => {
    const { token, pageId, updatedContent } = req.body;

    /*const { token, pageId, updatedContent } = {
        token: tokenGeneral,
        pageId: "16162566bdf64bff999f7937291c01b4",
        updatedContent: {
            Name: "re Updated",
            Numero: 10,
            "Other properties": "updated test"
        }
    };*/

    try {
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(400).send({ result: "Le token est invalide" })
            return;
        }

        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;

        const userDb = await notion.databases.retrieve({
            database_id: databaseId
        });

        const propertyManipulators = {
            title: (content) => ({ title: [{ text: { content } }] }),
            rich_text: (content) => ({ rich_text: [{ text: { content } }] }),
            number: (content) => ({ number: content }),
            date: (content) => ({ date: { start: content, end: content } }),
            formula: (content) => ({ formula: { expression: content } }),
            email: (content) => ({ email: content })
        };

        const newContent = Object.entries(updatedContent).reduce((acc, [key, value]) => {
            const propertyExists = userDb.properties.hasOwnProperty(key);
            if (propertyExists) {
                const propertyType = userDb.properties[key].type;
                const manipulateProperty = propertyManipulators[propertyType];
                acc[key] = manipulateProperty ? manipulateProperty(value) : value;
            } else {
                console.error(`La propriété "${key}" n'existe pas dans la base de données.`);
            }
            return acc;
        }, {});

        await notion.pages.update({
            page_id: pageId,
            properties: newContent
        });

        res.status(201).send({ results: "Page mise à jour avec succès :"})
    } catch (error) {
        res.status(400).send({ results: error})
    }
}

export const searchContent = async (req, res) => {
    const { token, name } = req.body;

    try {
        const searchResponse = await notion.databases.query({
            database_id: process.env.TOKENS_TABLE_ID,
            filter: { or: [{ property: "Token", title: { equals: token } }] }
        });

        if (searchResponse.results.length === 0) {
            res.status(400).send({ result: "Le token est invalide" })
            return;
        }

        const databaseId = searchResponse.results[0].properties.Id.rich_text[0].text.content;

        const searchUserDb = await notion.databases.query({
            database_id: databaseId
        });

        const propertyHandlers = {
            title: (value) => value[0]?.plain_text || "",
            rich_text: (value) => value[0]?.plain_text || "",
            number: (value) => value,
            date: (value) => value.start || "",
            formula: (value) => value.expression || "",
            email: (value) => value.email || ""
        };

        const results = []

        searchUserDb.results.filter((item) => {
            for (const key in item.properties) {
                const propertyType = item.properties[key].type;
                const propertyValue = item.properties[key][propertyType];
                const handleProperty = propertyHandlers[propertyType];

                if (handleProperty && handleProperty(propertyValue) === name) {
                    const content = item.properties;
                    content["_id"] = item.id
                    results.push(content)
                }
            }
        });

        res.status(201).send({ results: results})
    } catch (error) {
        res.status(201).send({ results: error})
    }
};