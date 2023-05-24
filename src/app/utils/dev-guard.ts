import { isDevMode } from '@angular/core';

export const DEV_GUARD = () => {
    return isDevMode();
};
