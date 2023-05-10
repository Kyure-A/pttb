export function newTrigger(): void {
    for (let trigger of ScriptApp.getScriptTriggers()) {
        let function_name: string = trigger.getHandlerFunction();
        if (function_name == "main" || function_name == "newTrigger") ScriptApp.deleteTrigger(trigger);
    }

    const now: Date = new Date();
    let plus: 1 | 2 = 1;
    if (now.getDay() == 5) plus = 2; // if tomorrow is Saturday

    const date: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plus, 21, 0);
    const new_trigger_date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plus, 22, 0);
    ScriptApp.newTrigger("main").timeBased().at(date).create();
    ScriptApp.newTrigger("newTrigger").timeBased().at(new_trigger_date).create();
}

export function getToday(delay: number = 0): string {
    const date: Date = new Date();
    date.setDate(date.getDate() + delay);
    return Utilities.formatDate(date, "JST", "M/d");
}

export function getDayOfWeek(delay: number = 0): string {
    const date: Date = new Date();
    date.setDate(date.getDate() + delay);
    const today: number = date.getDay();
    const arr: string[] = ['', '月', '火', '水', '木', '金', ''];
    return arr[today];
}

export function getSheet(sheet_name: string): string[][] {
    const sheet: GoogleAppsScript.Spreadsheet.Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const today_sheet = sheet.getSheetByName(sheet_name);
    const arr: GoogleAppsScript.Spreadsheet.Range = today_sheet!.getRange("A2:C9");
    const value: string[][] = arr.getValues();
    return value;
}

export function titleBuilder(delay: number = 0): string {
    const today: string = getToday(delay);
    const day_of_week: string = getDayOfWeek(delay);
    const str: string = today + " " + "(" + day_of_week + ")";
    if (day_of_week != '') return str;
    else return '';
}

export function is_specialday(today: string): boolean {
    const sheet: GoogleAppsScript.Spreadsheet.Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (sheet.getSheetByName(today) != null) return true;
    else return false;
}

export function fieldsBuilder(today: string, day_of_week: string): TimeTable[] {
    let value: string[][];

    if (is_specialday(today)) value = getSheet(today);
    else value = getSheet(day_of_week);

    const fields: TimeTable[] = [];
    for (var i = 0; i < value.length; i++) { // value.length は高々 8 回なので重くはない
        const time: number = (i + 1);
        const name: string = value[i][0];
        const room: string = value[i][1];
        const description: string = value[i][2];

        const json: TimeTable = {
            "name": time + " 時間目: " + name,
            "value": description,
            "inline": false
        }

        if (room != '') json.name += " (" + room + ")";

        if (name != '') fields.push(json); // ないときは push しない
    }

    return fields
}

export function main(): void {
    const delay: number = 1; // delay 日後 (だいたい 1) の日付を出す, 23 時くらいに次の日の時間割を告知するのにいる

    // PropertiesService.getDocumentProperties().setProperty("discord", "insert_your_webhook_url");

    const discord_url: string | null = PropertiesService.getDocumentProperties().getProperty("discord");

    const message: DiscordMessage = {
        "embeds": [
            {
                "title": titleBuilder(delay),
                "fields": fieldsBuilder(getToday(delay), getDayOfWeek(delay))
            }
        ]
    }

    const param: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        "method": "post",
        "headers": { 'Content-type': "application/json" },
        "payload": JSON.stringify(message)
    }

    UrlFetchApp.fetch(discord_url!, param);
}
