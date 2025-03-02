# Personal Transit Monitor

A modern, responsive web application to track public transit arrivals for your favorite stops and routes. Built with the 511.org API.

![Transit Monitor Screenshot](transit%20timer%20screenshot.png)

## Features

- **Real-time transit arrivals**: See when your bus or train is arriving in minutes
- **Custom stop groups**: Organize your transit stops with custom labels
- **Filter by line**: Only show arrivals for specific routes
- **Auto-refresh**: Data automatically refreshes every minute
- **Responsive design**: Works well on mobile devices
- **Dark mode support**: Automatically adapts to your system preferences
- **Secure**: API keys are stored server-side, not in client code

## Setup

1. **Get an API key from 511.org**
   - Request a free token at [511.org/open-data/token](https://511.org/open-data/token)

2. **Clone this repository**
   ```bash
   git clone https://github.com/yourusername/personal-transit-monitor.git
   cd personal-transit-monitor
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up your environment variables**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file and add your API key:
     ```
     API_KEY=your-api-key-here
     PORT=3000
     ```

5. **Configure your stops**
   - Open `js/app.js`
   - Edit the `stopsAndLabels` array to include your own stops:
     ```javascript
     const stopsAndLabels = [
       { label: "Home stops" },
       { label: "14 Mission", stopId: 15184 },
       { label: "From work", stopId: 13245, line: "14" }
     ];
     ```

6. **Start the server**
   ```bash
   npm start
   ```

7. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Customization

### Adding stops

To add a new stop:

1. Find the stop ID (Usually available on Google Maps or the transit agency's website)
2. Add an entry to the `stopsAndLabels` array in `js/app.js`:
   - For a section header: `{ label: "My Section" }`
   - For a stop: `{ label: "Bus name", stopId: 12345 }`
   - For a stop with specific line: `{ label: "Bus name", stopId: 12345, line: "14" }`

### Styling

The application uses CSS variables for easy customization. Edit `css/styles.css` to change colors, fonts, and layout.

## Deployment

### Node.js hosting (Render, Heroku, etc.)

1. Deploy your repository to your hosting provider
2. Set up the `API_KEY` environment variable in your hosting provider's settings

### Static hosting (GitHub Pages, Netlify, etc.)

If you want to use static hosting, you'll need to modify the application to use a serverless function or another API proxy service to protect your API key.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Data provided by [511.org](https://511.org/)
- Original concept based on a personal transit timer tool
