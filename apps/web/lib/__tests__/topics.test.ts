import { expect, test } from "bun:test";
import { isListedTopic, topicIntro, topicLabel, topicTitle } from "../topics";

test("stored English tags read as Spanish titles and labels", () => {
  expect(topicTitle("education")).toBe("Eventos de educación en LATAM");
  expect(topicTitle("hackathon")).toBe("Hackathones en LATAM");
  expect(topicLabel("ai")).toBe("IA");
  expect(topicLabel("conference")).toBe("conferencias");
  expect(topicIntro("workshop")).toStartWith("Workshops de tecnología");
});

test("an unknown tag keeps its own name", () => {
  expect(topicTitle("web3")).toBe("Eventos de web3 en LATAM");
  expect(topicLabel("web3")).toBe("web3");
});

test("too-broad tags are not listed", () => {
  expect(isListedTopic("general")).toBe(false);
  expect(isListedTopic("ai")).toBe(true);
});
