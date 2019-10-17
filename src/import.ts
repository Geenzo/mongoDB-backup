import * as fs from "fs";
import * as mongoose from "mongoose";

const mongoString: string = "mongodb://localhost:27017/admin";

const getImportData = () => {
    return new Promise((resolve, reject) => {
        fs.readFile("./3-3-2019_backup.json", { encoding: "utf8" }, (err, data) => {
            if (err) { throw err; }
            return resolve(JSON.parse(data));
        })
    });
};

const importData = (connection, data) => {
    const finishedImport = data.map((collection) => {
        const schema = new mongoose.Schema({}, { strict: false });
        const collectionModel = connection.model(collection.collectionName, schema, collection.collectionName);

        return collection.collectionData.map((item) => {
            return new collectionModel(item).save();
        });
    });
    return Promise.all(finishedImport);
};

mongoose.connect(mongoString, { useNewUrlParser: true }).then(async (connection) => {
    try {
        const getData = await getImportData();
        const importedData = await importData(connection, getData);

        // TODO: exit node process correctly when successful import
        return importedData;
    } catch(error) {
        // FIXME: handle error where duplicate ID's from improting same file.
        console.log("Error:", error);
        process.exit(1);
    }
});
