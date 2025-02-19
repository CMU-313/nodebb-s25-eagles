'use strict';

const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
	try {
		await client.connect();
		const db = client.db('admin');
		await db.createUser({ user: 'nodebb', pwd: 'nodebb', roles: [{ role: 'readWrite', db: 'nodebb' }, { role: 'clusterMonitor', db: 'admin' }] });
		console.log('User created successfully');
	} finally {
		await client.close();
	}
}

run().catch(console.dir);
