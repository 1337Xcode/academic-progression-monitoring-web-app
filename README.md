# Academic Progression Monitoring

The purpose of the Academic Progression Monitoring web app is to provide a web-based platform to support users in monitoring student performance and progression.

## Getting Started

Follow these steps to set up and run the application.

### Prerequisites

1. **Node.js**: Install Node.js from [nodejs.org](https://nodejs.org/).
2. **MAMP**: Install MAMP from [mamp.info](https://www.mamp.info/).

### Setup Steps

1. **Download the Project Files**:
   - Extract the project files from the provided ZIP file.

2. **Install Dependencies**:
   - Open a terminal in the project folder (where `package.json` is located).
   - Run the following command to install all required dependencies:
     ```bash
     npm install
     ```

3. **Set Up Environment Variables**:
   - The `.env` file is already provided in the project. It contains all the necessary environment variables.
   - **Important**: If you want to run the application on a different port, update the `DB_PORT` in the `.env` file to match your desired port.

4. **Set Up the Database**:
   - Start MAMP and ensure the MySQL server is running.
   - Open your browser and go to the following URL to access PHPMyAdmin:
     [PHPMyAdmin URL](http://localhost/phpMyAdmin5/index.php?route=/server/import)
   - Use the "Import" feature in PHPMyAdmin to upload the provided SQL file.

5. **Run Security Audit (Optional)**:
   - If there are any vulnerabilities, you can try fixing them with:
     ```bash
     npm audit fix
     ```

### Running the Application

1. **Start the Application**:
   - Run the following command to start the application:
     ```bash
     npm start
     ```
   - The application will run on the port specified in the `.env` file (default is `3000`).

2. **Access the Application**:
   - Open your browser and go to: `http://localhost:3000` (or the port you configured in the `.env` file).

3. **Development Mode**:
   - If you want the application to restart automatically when you make changes, use:
     ```bash
     npm run dev
     ```

### Login Information

#### Admin Login:
- **Username**: `admin`
- **Password**: `admin`

#### Student Login:
- **Username**: The part of the email address before `@`. For example:
  - If the email is `ryan3733333@gmail.com`, the username is `ryan3733333`.
- **Password**: The same as the username. For example:
  - If the username is `Ryan3733333`, the password is `ryan3733333` (no CAPS).

**Note**: For simplicity, the username and password are kept the same for student as well as admin accounts.

### Testing the API

1. **Install REST Client Extension**:
   - Install the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for Visual Studio Code.

2. **Use the `.rest` File**:
   - A `.rest` file is included in the project's api folder to test the API endpoints.
   - Open the `.rest` file in Visual Studio Code.
   - Use the REST Client extension to send requests to the API.

3. **Using Other Tools (Postman, Thunder Client, etc.)**:
[![example.png](https://i.postimg.cc/w38Db3r3/head.png)](https://postimg.cc/5QgHX9bM)
   - Add the following header to your requests:
     ```
     x-api-key: <your-api-key>
     ```
   - Replace `<your-api-key>` with the value of `API_KEY` from the `.env` file.

That's it! You should now have the application up and running.

~ Made with ❤️ by [1337XCode](https://github.com/1337Xcode) ~