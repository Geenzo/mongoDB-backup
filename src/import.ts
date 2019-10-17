import * as fs from "fs";
import { connect, Mongoose, Schema } from "mongoose";
import { IBackup } from "./@types/Backup";

const mongoString: string = "mongodb://localhost:27017/test2";

const getImportData = (): Promise<IBackup[]> => {
    return new Promise((resolve, reject) => {
        fs.readFile("./17-10-2019_backup.json", { encoding: "utf8" }, (err, data) => {
            if (err) { throw err; }
            return resolve(JSON.parse(data));
        });
    });
};

const importData = (connection: Mongoose, data: IBackup[]) => {
    const finishedImport = data.map((collection: IBackup) => {
        const schema = new Schema({}, { strict: false });
        const collectionModel = connection.model(collection.collectionName, schema, collection.collectionName);

        return collection.collectionData.map((item) => {
            return new collectionModel(item).save();
        });
    });
    return Promise.all(finishedImport);
};

connect(mongoString, { useNewUrlParser: true }).then(async (connection: Mongoose) => {
    try {
        const getData = await getImportData();
        const importedData = await importData(connection, getData);

        // TODO: exit node process correctly when successful import
        return importedData;
    } catch (error) {
        // FIXME: handle error where duplicate ID's from improting same file.
        console.log("Error:", error);
        process.exit(1);
    }
});
