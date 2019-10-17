import * as fs from "fs";
import * as mongoose from "mongoose";

console.log("launching...");

const mongoString: string = "mongodb://localhost/test";

const writeDataToFile = (data: Array<object>) => {
    const currentDate: Date = new Date();
    const dd: number = currentDate.getDate();
    const mm: number = currentDate.getMonth() + 1;
    const yyyy: number = currentDate.getFullYear();
    const currentDataFormatted: string = `${dd}-${mm}-${yyyy}`;

    fs.writeFile(`${currentDataFormatted}_backup.json`, JSON.stringify(data), (err) => {
        if (err) { throw err; }
        console.log(`${currentDataFormatted}_backup.json created!`);
        process.exit(0);
    });
};

const retrieveCollectionData = (models): Promise<Array<object>> => {
    const documents: Array<Promise<any>> = models.map((model) => {
        return model.find({}).then((collectionData) => {
            return {collectionName: model.modelName, collectionData };
        });
    });

    return Promise.all(documents);
};

const setupModels = (connection, collectionNames: Array<string>) =>
    collectionNames.map((collectionName) => connection.model(collectionName, {}, collectionName));

const getCollectionNames = (collections): Array<string> => collections.map((collection) => collection.collectionName);

mongoose.connect(mongoString, { useNewUrlParser: true }).then((connection) => {
    return connection.connection.db.collections().then(async (collections) => {
        const collectionNames = getCollectionNames(collections);
        const models = setupModels(connection, collectionNames);
        const data = await retrieveCollectionData(models);

        return writeDataToFile(data);
    });
});

