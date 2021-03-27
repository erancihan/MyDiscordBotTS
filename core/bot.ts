import { Client, Message } from "discord.js";
import { MongoClient, Db } from "mongodb";
import { CronJob } from "cron";
import Yargs from "yargs/yargs";
import { Arguments, Argv, BuilderCallback } from "yargs";

import { debug } from "./logger";

class Bot {
  private mongodb: MongoClient;
  private client: Client;
  private jobs: CronJob[];

  private identifier: RegExp;
  private yargs: Argv;

  private isBotReady: boolean;
  private OnBotReadyPromise: Promise<boolean>;
  private BotReadyPromise: (value) => void;

  protected MONGO_URI: string;

  constructor() {
    // command parser
    this.yargs = Yargs();
    this.yargs.command(
      "*",
      "default",
      () => {},
      (args) => {
        (args?.message as Message)?.channel?.send?.(
          "I do not know how to respond to that"
        );
      }
    );

    this.jobs = [];

    this.isBotReady = false;
    this.OnBotReadyPromise = new Promise((resolve, reject) => {
      this.BotReadyPromise = resolve;

      if (this.isBotReady) resolve(true);
    });

    // MongoDB connection
    this.mongodb = new MongoClient(
      `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@localhost:27017/${process.env.MONGODB_DB}`
    );
    (async () => {
      await this.mongodb.connect();
      await this.mongodb.db().command({ ping: 1 });
      console.log("Connected to MongoDB");
    })().catch(console.error);
  }

  RegisterClient(client: Client) {
    this.client = client;

    this.client.on<string>("ready", () => {
      console.log(
        `Logged in as ${this.client.user.tag}! ${this.client.user}\n`
      );

      this.identifier = new RegExp("^<@!?" + this.client.user.id + ">");

      // mark bot ready and resolve promise
      this.isBotReady = true;
      this.BotReadyPromise(true);

      // Start each registered job
      this.jobs?.forEach((job) => job?.start?.());
    });
  }

  RegisterCommand(
    command: string | ReadonlyArray<string>,
    description: string,
    builder?: BuilderCallback<{}, {}>,
    handler?: (argv: Arguments<{ message: Message; [K: string]: any }>) => void
  ) {
    this.yargs.command(command, description, builder, handler);
  }

  RegisterTask(
    cronTime: string,
    onTick: (bot: Bot) => void,
    onComplete?: () => void,
    startNow?: boolean,
    timeZone?: string
  ) {
    const task = () => {
      onTick.bind(null, this)();
    };

    const job = new CronJob({
      cronTime: cronTime,
      onTick: task,
      onComplete: onComplete,
      // startNow: startNow,
      timeZone: timeZone,
    });
    this.jobs.push(job);
  }

  OnMessage(message: Message): void {
    debug(">:", message.content);

    if (
      (message.channel.type !== "dm" &&
        !this.identifier.test(message.content)) ||
      message.author.id === this.client.user.id
    )
      return;

    const msg = message.content.replace(this.identifier, "").trim();
    this.yargs.parse(msg, { message });
  }

  OnBotReady(): Promise<boolean> {
    return this.OnBotReadyPromise;
  }

  Destruct(): void {
    this.jobs?.forEach((job) => job?.stop?.());
  }

  GetClient() {
    return this.client;
  }

  GetMongoDB(): Db {
    return this.mongodb.db();
  }
}

export default Bot;
