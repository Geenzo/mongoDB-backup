import * as fs from "fs";
import { Collection, connect, Document, Model, Mongoose, Schema } from "mongoose";
import { Transform } from "stream";

console.log("launching...");

const mongoString: string = "mongodb://localhost:27017/admin";

const writeDataToFile = async (models: Array<Model<Document, {}>>) => {
    const currentDate: Date = new Date();
    const dd: number = currentDate.getDate();
    const mm: number = currentDate.getMonth() + 1;
    const yyyy: number = currentDate.getFullYear();
    const currentDataFormatted: string = `${dd}-${mm}-${yyyy}`;

    // This pipes the POST data to the file
    const documents: Array<Promise<any>> = [];

    for (let i = 0; i < models.length; i++) {
        let writeStream: any;
        let firstRow: boolean = true;

        const transformStream = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                const output = firstRow ? JSON.stringify(chunk) : `,${JSON.stringify(chunk)}`;

                if (firstRow) {
                    this.push("[");
                    firstRow = false;
                }

                this.push(output);
                callback();
            },
            flush(callback) {
                this.push("]");
                callback();
            },
        });

        if (i === 0) {
            // This opens up the writeable stream to `output`
            await fs.promises
            .mkdir(`backup/${currentDataFormatted}/`, { recursive: true })
            .catch((err) => console.error("ERROR:", err));

            writeStream = fs.createWriteStream(`backup/${currentDataFormatted}/${models[i].collection.collectionName}_backup.json`, { flags: "w" });
        } else {
            writeStream = fs.createWriteStream(`backup/${currentDataFormatted}/${models[i].collection.collectionName}_backup.json`, { flags: "a" });
        }

        const modelDone: any = await new Promise((resolve, reject) => {
            const readStream = models[i].find({}).cursor()
            .pipe(transformStream)
            .pipe(writeStream)
            .on("finish", (doc: any) => {
                console.log(`Progress: ${i + 1}/${models.length} - ${models[i].modelName}`);
                resolve("done");
            });

            // This is here incase any errors occur
            readStream.on("error", (err: any) => {
                console.log("Error during reading mongoose cursor:", err);
                reject("failed");
            });

            // This is here incase any errors occur
            transformStream.on("error", (err: any) => {
                console.log("Error during transform stream:", err);
                reject("failed");
            });

            // This is here incase any errors occur
            writeStream.on("error", (err: any) => {
                console.log("Error during write stream:", err);
                reject("failed");
            });
        });

        documents.push(modelDone);
        firstRow = true;
    }

    return Promise.all(documents).then((success) => {
        console.log("done success: ", success);
    }).catch((err) => {
        console.log("error in catch: ", err);
    });
};

const setupModels = (connection: Mongoose, collectionNames: string[]): Array<Model<Document, {}>> =>
    collectionNames.map((collectionName) => connection.model(collectionName, new Schema({}), collectionName));

const getCollectionNames = (collections: Collection[]): string[] =>
    collections
    .filter((collection: Collection) => collection.collectionName !== "system.version")
    .map((collection: Collection) => collection.collectionName);


connect(mongoString, { useNewUrlParser: true,  }).then((connection: Mongoose) => {
    return connection.connection.db.collections().then(async (collections: Collection[]) => {
        const collectionNames = getCollectionNames(collections);
        console.log("collection names", collectionNames);
        const models = setupModels(connection, collectionNames);

        return writeDataToFile(models);
    });
});

