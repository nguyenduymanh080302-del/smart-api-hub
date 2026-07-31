import request from "supertest";
import { app } from "../index";

export const api = request(app);