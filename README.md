# ApexTracker Discord Bot

A Discord bot designed to provide real-time Apex Legends statistics, including Predator border tracking and player stats.

## Features

*   **Live Predator Border Tracking**: Displays the current Apex Legends Predator border, updated every minute, and persists across bot restarts.
*   **Predator Border History**: Shows the difference in Predator border RP from 24 hours ago.
*   **Player Statistics**: Retrieves and displays detailed statistics for a specified Apex Legends player.
*   **Persistent Live Updates**: Utilizes SQLite to manage and maintain live update messages, overcoming Discord's 15-minute interaction token limit.

## Setup

### Prerequisites

Before running the bot, ensure you have the following installed:

*   [Node.js](https://nodejs.org/en/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   A [Discord Bot Token](https://discord.com/developers/applications)
*   Your Discord Bot's [Client ID](https://discord.com/developers/applications)
*   An [Apex Legends API Key](https://apexlegendsapi.com/) (or similar service if you're using a different one)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ApexTracker.git
    cd ApexTracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root directory of your project with the following content:

```env
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_BOT_CLIENT_ID
APEX_API_KEY=YOUR_APEX_LEGENDS_API_KEY
```

Replace `YOUR_DISCORD_BOT_TOKEN`, `YOUR_DISCORD_BOT_CLIENT_ID`, and `YOUR_APEX_LEGENDS_API_KEY` with your actual credentials.

## Running the Bot

1.  **Deploy Slash Commands:**
    Register the bot's slash commands with Discord. This step also ensures that any outdated commands are removed.
    ```bash
    npm run deploy
    ```

2.  **Start the Bot:**
    ```bash
    npm start
    ```

The bot should now be online and ready to receive commands in your Discord server.

## Commands

Here are the slash commands available:

*   `/predator-border-live`: Displays the current Apex Legends Predator border and updates it every minute.
*   `/stop-predator-border-live [message_id]`: Stops the live update of the Predator border. If `message_id` is provided, only that specific message's update will stop. Otherwise, all live updates in the current channel will cease.
*   `/predator`: Displays the current Apex Legends Predator border and the difference from 24 hours ago.
*   `/stats [player] [platform]`: Displays Apex Legends statistics for a specified player on a given platform (PC, PS4, X1).

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.
