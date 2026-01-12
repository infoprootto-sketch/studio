
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.cwd();
const gitDir = path.join(projectDir, '.git');

function runCommand(command) {
    try {
        const output = execSync(command, { stdio: 'pipe' });
        console.log(output.toString());
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.stderr.toString());
        throw error;
    }
}

function resetGitRepository() {
    console.log("====================================================================");
    console.log("--- StayCentral Git Repository Repair Script ---");
    console.log("====================================================================");

    try {
        // Step 1: Remove the corrupted .git directory
        if (fs.existsSync(gitDir)) {
            console.log("Found corrupted .git directory. Removing...");
            if (process.platform === "win32") {
                runCommand(`rmdir /s /q "${gitDir}"`);
            } else {
                runCommand(`rm -rf "${gitDir}"`);
            }
            console.log("Successfully removed the old repository.");
        } else {
            console.log(".git directory not found, which is okay. Starting fresh.");
        }

        // Step 2: Initialize a new, clean repository
        console.log("\nInitializing a new, clean Git repository...");
        runCommand('git init');

        console.log("\n--------------------------------------------------------------------");
        console.log("✅ SUCCESS: Your Git repository has been reset successfully.");
        console.log("--------------------------------------------------------------------");
        console.log("\nNEXT STEPS:");
        console.log("1. Add your GitHub repository remote again.");
        console.log("2. Commit and push your code.");
        console.log("\nI will guide you through these commands in my next message.");
        console.log("====================================================================");

    } catch (error) {
        console.error("\n❌ An error occurred during the reset process.");
        console.error("Please review the errors above.");
    }
}

resetGitRepository();
