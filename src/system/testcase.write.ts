import { Request, RequestHandler, Response } from "express";
import openaiAgent from "../llm/lib/openai.agent";
import fileUpload from "./lib/azure.file.upload";
import browserPlaywright from "./lib/playwrite.browser";
import testcaseParse from "./lib/testcase.parse";
import createExcelFile from "./lib/excel.file.create";
import { MODEL, MIMETYPE } from "../../shared/constant";
import { PROMPT } from "../../shared/prompt";
import fs from "fs";
import path from "path";

export default (async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    const imageBuffer = await browserPlaywright(url);

    const imageUrl = await fileUpload(imageBuffer, MIMETYPE.image);

    const testCase = await openaiAgent(MODEL.gpt_4o, [
      { type: "text", text: PROMPT.testcaseGeneration },
      { type: "image_url", image_url: { url: imageUrl } },
    ]);

    const result = testcaseParse(testCase);

    // const jsonPath = path.resolve(__dirname, "./test_result.json");
    // const fileContent = fs.readFileSync(jsonPath, "utf-8");
    // const result = JSON.parse(fileContent);

    const excelBuffer = await createExcelFile(result, url);

    const excelUrl = await fileUpload(excelBuffer, MIMETYPE.xlsx);

    return res.status(200).json({
      data: excelUrl,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Server error");
    }
  }
}) as unknown as RequestHandler;
