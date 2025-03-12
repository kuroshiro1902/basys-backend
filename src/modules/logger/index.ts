const currentTimeString = () => new Date().toLocaleString();

// export const logger = pino({ name: 'server start' });
export const logger = {
  info: (message?: any, ...optionalParams: any[]) =>
    console.info(`%c[${currentTimeString()}] [info]: `, 'color: blue; font-weight: bold;', message, ...optionalParams),

  warn: (message?: any, ...optionalParams: any[]) =>
    console.warn(`%c[${currentTimeString()}] [warn]: `, 'color: orange; font-weight: bold;', message, ...optionalParams),

  error: (message?: any, ...optionalParams: any[]) =>
    console.error(`%c[${currentTimeString()}] [error]: `, 'color: red; font-weight: bold;', message, ...optionalParams),
  // trace: (message?: any, ...optionalParams: any[]) => {
  //   console.error(`%c[${currentTimeString()}]: `, 'color: teal; font-weight: bold;', message, ...optionalParams);
  // },
};
