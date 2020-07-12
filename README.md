[![Unlicense][license-badge]][license]
![Dependabot](https://flat.badgen.net/dependabot/FoseFx/twitch-chatbot-boilerplate-core?icon=dependabot)
[![Maintainability](https://api.codeclimate.com/v1/badges/8ee259e1ace1b4f7b5aa/maintainability)](https://codeclimate.com/github/FoseFx/twitch-chatbot-boilerplate-core/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8ee259e1ace1b4f7b5aa/test_coverage)](https://codeclimate.com/github/FoseFx/twitch-chatbot-boilerplate-core/test_coverage)

# twitch-chatbot-boilerplate-core
## [API DOCS][api-docs] | [Wiki][wiki]

> This project is not affiliated to Twitch Interactive Inc in any way.

## Read this first

This package should only be used directly when you don't seek for a full boilerplate as it only exports the [initialize()][initialize-api] function.
It is recommended for new projects to use the [main repo as a boilerplate][boilerplate].

## How does it work?

> Read the [main repo's setup guide][setup-full] first, register an app and create a new account.

1. Install this package: `npm i twitch-chatbot-boilerplate`

2. Generate a new secret and copy both the secret and your Client-ID
3. Create a `.env` file ([download an example here][env-example]) and enter all necessary information, alternatively you can use any other way of setting an environment variable
4. Download or create your own [views directory][views-dl]. If you choose to download it, download the [public directory][public-dl] aswell.

5. Call [initialize()][initialize-api] and follow further instructions

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

[Next Steps][next-steps]

## Caveats
See [wiki][caveats].

## Available Scripts

- `clean` - remove caches and build files,
- `build` - TypeScript build,
- `build:watch` - executes `build` on every file change,
- `lint` - run the linter,
- `test` - run the tests,
- `test:watch` - executes `test` on every file change

## License

Licensed under the Unlicense. See the [LICENSE](https://github.com/fosefx/twitch-chatbot-boilerplate-core/blob/master/LICENSE) file for details.

[wiki]: https://github.com/FoseFx/twitch-chatbot-boilerplate/wiki
[initialize-api]: https://fosefx.github.io/twitch-chatbot-boilerplate-core/docs/modules/_core_.html#initialize
[boilerplate]: https://github.com/FoseFx/twitch-chatbot-boilerplate/
[views-dl]: https://downgit.github.io/#/home?url=https://github.com/FoseFx/twitch-chatbot-boilerplate/tree/master/views
[public-dl]: https://downgit.github.io/#/home?url=https://github.com/FoseFx/twitch-chatbot-boilerplate/tree/master/public
[env-example]: https://raw.githubusercontent.com/FoseFx/twitch-chatbot-boilerplate/master/.env.example
[license-badge]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license]: https://github.com/fosefx/twitch-chatbot-boilerplate-core/blob/master/LICENSE
[tmijsdocs]: https://github.com/tmijs/docs/tree/gh-pages/_posts/v1.4.2
[limits]: https://dev.twitch.tv/docs/irc/guide#command--message-limits
[verifydocs]: https://dev.twitch.tv/docs/irc/guide#known-and-verified-bots
[caveats]: https://github.com/FoseFx/twitch-chatbot-boilerplate/wiki/Caveats
[api-docs]: https://fosefx.github.io/twitch-chatbot-boilerplate-core/docs/index.html
[setup-full]: https://github.com/FoseFx/twitch-chatbot-boilerplate/wiki/Setup#setup-full
[next-steps]: https://github.com/FoseFx/twitch-chatbot-boilerplate/wiki/Setup#next-steps
