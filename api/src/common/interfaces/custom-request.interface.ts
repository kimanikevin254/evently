import { Request } from 'express';

export interface UserInterface {
	id: string;
}

export interface CustomRequest extends Request {
	user?: UserInterface;
}
