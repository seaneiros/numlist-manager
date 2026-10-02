import { Request, Response } from 'express';


export type ControllerHandler = (req: Request, res: Response) => void;