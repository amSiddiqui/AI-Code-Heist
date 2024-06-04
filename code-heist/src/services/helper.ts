import Player from "@app/models/Player";

export const secondsToHourMinuteSecond = (seconds: number) => {
    seconds = Math.round(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + "h" : ""} ${m > 0 ? m + "m" : ""} ${
        s > 0 ? s + "s" : ""
    }`;
};

export const calculatePlayerScore = (player: Player) =>
    Object.values(player.score).reduce((acc, val) => acc + val, 0);

export const formatISODate = (isoDate: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleString();
};