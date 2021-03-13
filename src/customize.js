import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';

export async function customize() {
    clear();
    console.log( chalk.greenBright(figlet.textSync('demo-cli', {horizontalLayout: 'full'})) );
}