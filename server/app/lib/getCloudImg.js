'use strict';
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require("axios");
let Logger = require('node-color-log');
const logger = new Logger();
async function getCloudImg(uuid, context) {
    if (context.platform == "line") {
        try {
            const res = await axios({
                method: 'get',
                url: `https://api-data.line.me/v2/bot/message/${context.id}/content`,
                responseType: 'arraybuffer',
                headers: {
                    'Authorization': `Bearer ${context.token}`
                }
            });
            logger.log('get image from line')
            return res.data;
        } catch (err) {
            logger.error(`[${uuid}] ${err}`);
            return null;
        }
    } else if (context.platform == "telegram") {
        try {
            const url1 = `https://api.telegram.org/bot${context.token}/getFile?file_id=${context.id}`;
            const res1 = await axios.get(url1);
            const fileInfo = res1.data.result;
            const url2 = `https://api.telegram.org/file/bot${context.token}/${fileInfo.file_path}`;
            const res2 = await axios.get(url2, {
                responseType: 'arraybuffer'
            });
            return res2.data;
        } catch (err) {
            logger.error(`[${uuid}] ${err}`);
            return null;
        }
    } else { // not support this platform
        return null;
    }
}


async function main(uuid, context) {
    logger.info(`[${uuid}] <${context.platform}> <${context.id}>`);
    logger.info(`[${uuid}] start downloading image`);
    const imgBin = await getCloudImg(uuid, context);
    if (!imgBin) {
        return null;
    }
    const fileName = `${(new Date()).getTime()}-${context.platform}.jpg`;
    logger.info(`[${uuid}] resize the image ${fileName}`);
    await sharp(imgBin).resize(400).toFile(fileName).catch(e => console.log(e));
    logger.info(`[${uuid}] run tensorflow to classify the image`);
    return fileName;
}

module.exports = main;
