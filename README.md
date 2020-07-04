[![Unlicense][license-badge]][license]
![Dependabot](https://flat.badgen.net/dependabot/FoseFx/twitch-chatbot-boilerplate-core?icon=dependabot)
[![Maintainability](https://api.codeclimate.com/v1/badges/8ee259e1ace1b4f7b5aa/maintainability)](https://codeclimate.com/github/FoseFx/twitch-chatbot-boilerplate-core/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8ee259e1ace1b4f7b5aa/test_coverage)](https://codeclimate.com/github/FoseFx/twitch-chatbot-boilerplate-core/test_coverage)

# twitch-chatbot-boilerplate-core

> This project is not affiliated to Twitch Interactive Inc in any way.

## Read this first

This package should only be used directly when you don't seek for a full boilerplate as it only exports the `initialize` function.
It is recommended for new projects to use the [main repo as a boilerplate][boilerplate].

## How does it work?

> Read the [main repo's setup guide][boilerplate] first, register an app and create a new account.

1. Install this package: `npm i twitch-chatbot-boilerplate`

2. Generate a new secret and copy both the secret and your Client-ID
3. Create a `.env` file ([download an example here][env-example]) and enter all necessary information, alternatively you can use any other way of setting an environment variable
4. Download or create your own [views directory][views-dl]. If you choose to download it, download the [public directory][public-dl] aswell.

5. Call `initialize()` and follow further instructions

```JavaScript
const { initialize } = require('twitch-chatbot-boilerplate');

async function main() {
    const { client } = await initialize();

    // This is the example on the tmi.js website
    client.on('message', (channel, userstate, message, self) => {
        if (self) return;
        if (message.toLowerCase() === '!hello') {
            client.say(channel, `@${userstate.username}, heya!`);
        }
    });
}
main().catch((e) => console.error(e));
```

7. Write your bot's logic
8. Deploy it
9. **Profit**

## Next Steps

- Read the [tmi.js docs][tmijsdocs]
- Read more about [commands and message limits][limits]
- Get your bot [known and verified][verifydocs]

## Caveats

### New Routes

Even though `initialize()` also returns the express instance, you can not simply add new routes (e.g. simply do a `app.get('/test', () => {...})`).
Instead you need to use the `beforeRouteSetup` hook.

Example:

```JavaScript
const options = {
    beforeRouteSetup(app) {
        app.get('/test', (req, res) => { ... })
    }
};

const { client } = await initialize(options);
```

### Join and part chats

Normaly streamers can add the bot by visiting `/add` and remove it on `/remove`.
When the bot goes down and needs to be restarted, the list of channels is persisted in `.config/channels.json`.
If you need to, for whatever reason, join or part channels programmatically,
import the `joinChannel()` and `leaveChannel()` functions.

Example:

```JavaScript
const { joinChannel, leaveChannel } = require('twitch-chatbot-boilerplate';

...
await joinChannel("fosefx");
await leaveChannel("fosefx");
...
```

## Available Scripts

- `clean` - remove caches and build files,
- `build` - TypeScript build,
- `build:watch` - executes `build` on every file change,
- `lint` - run the linter,
- `test` - run the tests,
- `test:watch` - executes `test` on every file change

## License

Licensed under the Unlicense. See the [LICENSE](https://github.com/fosefx/twitch-chatbot-boilerplate-core/blob/master/LICENSE) file for details.

[boilerplate]: https://github.com/FoseFx/twitch-chatbot-boilerplate/
[views-dl]: https://downgit.github.io/#/home?url=https://github.com/FoseFx/twitch-chatbot-boilerplate/tree/master/views
[public-dl]: https://downgit.github.io/#/home?url=https://github.com/FoseFx/twitch-chatbot-boilerplate/tree/master/public
[env-example]: https://raw.githubusercontent.com/FoseFx/twitch-chatbot-boilerplate/master/.env.example
[license-badge]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license]: https://github.com/fosefx/twitch-chatbot-boilerplate-core/blob/master/LICENSE
[tmijsdocs]: https://github.com/tmijs/docs/tree/gh-pages/_posts/v1.4.2
[limits]: https://dev.twitch.tv/docs/irc/guide#command--message-limits
[verifydocs]: https://dev.twitch.tv/docs/irc/guide#known-and-verified-bots
