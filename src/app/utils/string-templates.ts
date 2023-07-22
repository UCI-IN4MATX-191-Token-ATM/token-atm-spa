export function actionNeededTemplate(innerText: string): string {
    return `\n***ACTION NEEDED***: \n${innerText}\n***Sorry for the Inconvenience!`;
}

export function tokenATMContentListTemplate(article: 'the' | 'a' | '', separator: string, shortened = false): string {
    const prefix = article.length > 0 ? article + ' ' : article;
    const result = shortened
        ? [`${prefix}2 pages,`, 'assignment group, and', 'module']
        : [
              `1) ${prefix}two Canvas pages prefixed with 'Token ATM',`,
              `2) ${prefix}Canvas assignment group prefixed with 'Token ATM', and`,
              `3) ${prefix}Canvas module prefixed with 'Token ATM'.`
          ];
    return result.join(separator);
}
