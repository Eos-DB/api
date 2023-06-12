import { Router } from "express";
import { 
    createNewDB, 
    addColumn, 
    editRowName, 
    editColumnProperty,
    deleteColumn,
    deleteDB,
    addContent,
    deleteContent,
    queryDb,
    editContent,
    searchContent
} from "../controllers/index.js";

const userDB = Router();

userDB.get('/exemple', (req, res) => res.status(200).json([{"Token":"1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6","id":1,"name":"Device 1","status":"on","created_time":"2023-06-06T10:30:00","description":"Ceci est la description de l'appareil 1."},{"Token":"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6","id":2,"name":"Device 2","status":"off","created_time":"2023-06-05T14:45:00","description":"Ceci est la description de l'appareil 2."},{"Token":"1a1a2b2b3c3c4d4d5e5e6f6f7g7g8h8h9i9i","id":3,"name":"Device 3","status":"on","created_time":"2023-06-04T08:15:00","description":"Ceci est la description de l'appareil 3."}]));
// create a new data base
userDB.post('/newDB', createNewDB)
//add a row in an existant db, token and name required
userDB.post('/addColumn', addColumn)
// Edit row name
userDB.post('/editRowName', editRowName)
// Edit row propertie
userDB.post('/editColumnProperty', editColumnProperty)
// Delete a column
userDB.post('/deleteColumn', deleteColumn)
// Delete a database
userDB.post('/deleteDB', deleteDB)
// Add content to a data base
userDB.post('/addContent', addContent)
// Delete content to a data base
userDB.post('/deleteContent', deleteContent)
// Query a data base
userDB.post('/queryDb', queryDb)
// Edit content on a data base
userDB.post('/editContent', editContent)
// Search content on a data base
userDB.post('/searchContent', searchContent)

export default userDB;
