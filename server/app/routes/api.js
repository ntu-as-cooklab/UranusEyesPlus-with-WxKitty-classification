'use strict';

const express = require('express');
const api = express.Router();
const exec = require('child_process').exec;
const path = require('path');
const Logger = require('node-color-log');
const fs = require('fs');
const logger = new Logger();


const env = process.env.NODE_ENV || 'development';
const config = require('../../config')[env];

const zerorpc = require("zerorpc");
const getCloudImg = require("../lib/getCloudImg")
const pythonFile = path.join(__dirname, '../../python/label_image.py');
const labelFile = path.join(__dirname, '../../model/retrained_labels.txt');
const graphFile = path.join(__dirname, '../../model/retrained_graph.pb');
let client = new zerorpc.Client();
//Execute python
const command = `python3 ${pythonFile} ${labelFile} ${graphFile}`;
exec(command)
logger.color('yellow').reverse().log(command);
const uuidv1 = require('uuid/v1');

api.post('/classify', async (req, res) => {
    const uuid = uuidv1();
    logger.info(`/api/classify: [${uuid}] new request`);

    const context = req.body;
    console.log(req.body);
    if (!(context.platform && context.id && context.token)) {
        logger.info(`/api/classify: [${uuid}] return 400 from bodyWrong`);
        return res.status(400).send("body wrong");
    }

    const filePath = await getCloudImg(uuid, context);
    let isSuccess = false
    logger.log(`Python file: ${filePath}`);
    logger.log('Connecting to Python Server ...');
    client.connect("tcp://127.0.0.1:5555");
    logger.log('Connection succeeded');
    client.invoke("inferenceForLine", filePath, function(error, stdout, stderr) {
        if (error !== undefined) {
           logger.error(`[${uuid}] ${error}from getCloudImgResult`);
           fs.unlink(filePath, err => {
               if (err) logger.error(err);
               logger.info(`[${uuid}] the image delete.`)
           });
           return res.json({
                "success": "false",
                "message": 'failed to get result'
           });
        }
        isSuccess = true;
        logger.info(`[${uuid}] ${stdout}from getCloudImgResult`);
        fs.unlink(filePath, err => {
            if (err) logger.error(err);
            logger.info(`[${uuid}] the image delete.`)
        });
        return res.json(JSON.parse(stdout))
    });
    setTimeout(() => {
        if (!isSuccess) {
            fs.unlink(filePath, err => {
                if (err) logger.error(err);
                logger.info(`[${uuid}] the image delete.`)
            });
            return res.json({
                "success": 'false',
                "message": 'failed get the result'
             });
        }
    }, 20000)
})

api.post('/getResult', (req, res) => {
    let isSuccess = false;
    const target = req.body.target;
    const filename = req.body.filename;

    logger.color('magenta').reverse().log(`Receive target: ${target}, filename: ${filename}`)

    const filePath = path.join(config.dataPath, target, filename);
    logger.color('magenta').log(`Find the image at ${filePath}`)

    // Connect to Python Server
    logger.log('Connecting to Python Server ...');
    client.connect("tcp://127.0.0.1:5555");
    logger.log('Connection succeeded');
    client.invoke('inference', filePath, function(error, stdout, stderr){
        logger.log(stdout);
        logger.log(stderr);
        isSuccess = true;
        if (error !== undefined) {
            logger.color('blue').error(error);
            return res.json({
                success: false,
                message: 'Fail to get the result'
            })
        }
        return res.json({
            success: true,
            result: JSON.parse(stdout),
            message: 'get the result'
        })
    });
    setTimeout(() => {
        if (!isSuccess) {
            return res.json({
                success: false,
                message: 'failed get the result'
            });
        }
    }, 20000)
})

module.exports = api;
