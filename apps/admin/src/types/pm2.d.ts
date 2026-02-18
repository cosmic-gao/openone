declare module 'pm2' {
    export interface ProcessDescription {
        name?: string;
        pid?: number;
        pm_id?: number;
        monit?: {
            memory?: number;
            cpu?: number;
        };
        pm2_env?: {
            status?: string;
            pm_uptime?: number;
            env?: Record<string, string>;
            [key: string]: any;
        };
        [key: string]: any;
    }

    export interface StartOptions {
        name: string;
        script: string;
        args?: string | string[];
        cwd?: string;
        env?: Record<string, string | number>;
        autorestart?: boolean;
        max_restarts?: number;
        [key: string]: any;
    }

    export interface PM2 {
        connect(callback: (err: any) => void): void;
        connect(noDaemon: boolean, callback: (err: any) => void): void;

        start(options: StartOptions, callback: (err: any, proc: ProcessDescription[]) => void): void;
        start(script: string, callback: (err: any, proc: ProcessDescription[]) => void): void;

        stop(process: string | number, callback: (err: any, proc: ProcessDescription) => void): void;
        restart(process: string | number, callback: (err: any, proc: ProcessDescription) => void): void;
        delete(process: string | number, callback: (err: any, proc: ProcessDescription) => void): void;

        list(callback: (err: any, list: ProcessDescription[]) => void): void;
        describe(process: string | number, callback: (err: any, list: ProcessDescription[]) => void): void;

        disconnect(): void;
    }

    const pm2: PM2;
    export default pm2;
}
