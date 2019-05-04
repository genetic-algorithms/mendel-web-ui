// The info we get from from the svr api about what plots are available for a job/tribe
export type PlotInfo = {
    files: string[];
    tribes: number[];
};
