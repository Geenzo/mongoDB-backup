import * as fs from "fs";
import { Collection, connect, Document, Model, Mongoose, Schema } from "mongoose";

console.log("launching...");

const mongoString: string = "mongodb://localhost:27017/admin";

const writeDataToFile = (data: object[]) => {
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

const retrieveCollectionData = (models: Array<Model<Document, {}>>): Promise<object[]> => {
    const documents: Array<Promise<any>> = models.map(async (model) => {
        const collectionData = await model.find({}).exec();
        return { collectionName: model.modelName, collectionData };
    });

    return Promise.all(documents);
};

const setupModels = (connection: Mongoose, collectionNames: string[]): Array<Model<Document, {}>> =>
    collectionNames.map((collectionName) => connection.model(collectionName, new Schema({}), collectionName));

const getCollectionNames = (collections: Collection[]): string[] =>
    collections.map((collection: Collection) => collection.collectionName);

connect(mongoString, { useNewUrlParser: true }).then((connection: Mongoose) => {
    return connection.connection.db.collections().then(async (collections: Collection[]) => {
        const collectionNames = getCollectionNames(collections);
        const models = setupModels(connection, collectionNames);
        const data = await retrieveCollectionData(models);

        return writeDataToFile(data);
    });
});

