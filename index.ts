import * as mongoose from 'mongoose';
import * as fs from 'fs';

console.log('launching...')

const mongoString: string = 'mongodb://localhost/test'

const writeDataToFile = (data: Array<object>) => {
    const currentDate: Date = new Date;
    const dd: number = currentDate.getDate();
    const mm: number = currentDate.getMonth()+1; 
    const yyyy: number = currentDate.getFullYear();
    const currentDataFormatted: string = `${dd}-${mm}-${yyyy}`;

    fs.writeFile(`${currentDataFormatted}_backup.json`, JSON.stringify(data), (err) => {
        if (err) throw err;
        console.log(`${currentDataFormatted}_backup.json created!`);
        process.exit(0)
    });
}

const retrieveCollectionData = (models) => {
    const documents: Array<Promise<any>> = models.map(model => {
        return model.find({}).then(collectionData => {
            return {collectionName: model.modelName, collectionData }
        });
    });

    return Promise.all(documents).then((documentData: Array<object>) => {
        writeDataToFile(documentData);
    })
}

const setupModels = (connection, collectionNames: Array<string>) => {
    const models = collectionNames.map(collectionName => connection.model(collectionName, {}, collectionName));
    return retrieveCollectionData(models);
}

mongoose.connect(mongoString, { useNewUrlParser: true }).then((connection) => {
    return connection.connection.db.collections().then(collections => {
        const collectionNames = collections.map(collection => collection.collectionName);
        return setupModels(connection, collectionNames);
    })
})

