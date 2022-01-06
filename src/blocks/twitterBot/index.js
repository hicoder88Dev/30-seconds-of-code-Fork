import fetch from 'node-fetch';
import Twitter from 'twitter';
import fs from 'fs-extra';
import { sample } from 'utils';
import { Logger } from 'blocks/utilities/logger';

const promisify = func => (...args) =>
  new Promise((resolve, reject) =>
    func(...args, (err, result) => (err ? reject(err) : resolve(result)))
  );

/* eslint-disable camelcase */
export class TwitterBot {
  static client = new Twitter({
    consumer_key: process.env['CONSUMER_KEY'],
    consumer_secret: process.env['CONSUMER_SECRET'],
    access_token_key: process.env['ACCESS_TOKEN_KEY'],
    access_token_secret: process.env['ACCESS_TOKEN_SECRET'],
  });

  /**
   * Fetches a random snippet chirp.
   * @param {string} url - chirp.json URL.
   */
  static getRandomSnippet = async () => {
    const url = 'https://www.30secondsofcode.org/chirp.json';
    const logger = new Logger('TwitterBot.getRandomSnippet');
    logger.log('Fetching random snippet');
    const chirp = await fetch(url);
    let links = await chirp.json();
    logger.success('Finished fetching random snippet');
    return sample(links);
  };

  /**
   * Tweets a media tweet with a screenshot and a snippet caption.
   * @param {string} description - The caption of the tweet.
   */
  static tweet = promisify(description => {
    const logger = new Logger('TwitterBot.tweet');
    logger.log('Preparing tweet');
    const snippetImage = fs.readFileSync('snippet.png');
    TwitterBot.client.post(
      'media/upload',
      { media: snippetImage },
      function (error, media) {
        if (!error) {
          // If successful, a media object will be returned.
          logger.success('Finished uploading media');

          // Let's tweet it
          var status = {
            status: description,
            media_ids: media.media_id_string, // Pass the media id string
          };

          TwitterBot.client.post('statuses/update', status, function (error) {
            if (!error) logger.success('Tweet successful');
          });
        } else logger.error(`Error: ${error}`);
      }
    );
  });
}