require('dotenv').config();
const express = require("express");
const { config } = require("./configuration/config");
const CRouter = require("./router/RouterC");
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors({
    origin :"http://localhost:3000",
    credentials : true
}));
app.use(bodyParser.json());
app.use(cookieParser())
config();

app.post('/gpt2', (req, res) => {
    const { prompt } = req.body;
    const token = req.header("token"); // Optional token for auth

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const pythonPath = process.env.PYTHON_PATH || "python";
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const escapedToken = token ? token.replace(/"/g, '\\"') : "";
    const command = `"${pythonPath}" gpt2.py "${escapedPrompt}" "${escapedToken}"`;
    console.log("Executing command:", command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return res.status(500).json({ error: 'Failed to generate text', details: stderr || error.message });
        }
        if (stderr) {
            console.error(`Python stderr: ${stderr}`);
        }

        let generatedText;
        try {
            generatedText = JSON.parse(stdout.trim());
        } catch (e) {
            console.error("Failed to parse Python output:", e.message);
            return res.status(500).json({ error: 'Invalid JSON from Python script', details: stdout });
        }

        console.log("Generated Text:", generatedText);
        res.json({
            message: generatedText.message,
            jobs: generatedText.jobs || [],
            rawResponse: generatedText.rawResponse
        });
    });
});

app.use("/", CRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));