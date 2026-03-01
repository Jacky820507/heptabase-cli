import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const syncScriptPath = path.join(__dirname, "heptabase-sync.cjs");

// Create MCP Server instance
const server = new Server(
    {
        name: "heptabase-custom-tools",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Helper function to execute local CLI
async function runSyncCommand(args: string[]): Promise<string> {
    try {
        const { stdout, stderr } = await execFileAsync("node", [syncScriptPath, ...args], {
            encoding: "utf8",
            maxBuffer: 50 * 1024 * 1024,
        });
        return stdout + (stderr ? `\nErrors:\n${stderr}` : "");
    } catch (error: any) {
        throw new Error(`Command execution failed: ${error.message}\n${error.stdout || ""}\n${error.stderr || ""}`);
    }
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "heptabase_import",
                description: "大量匯入 Markdown 檔案至 Heptabase。請指定包含 Markdown 檔案的本地資料夾路徑。資料夾結構會被當作前綴寫入卡片標題。",
                inputSchema: {
                    type: "object",
                    properties: {
                        dirPath: {
                            type: "string",
                            description: "本地端包含 Markdown 檔案的資料夾絕對路徑。例如：D:\\PDF_Library",
                        },
                    },
                    required: ["dirPath"],
                },
            },
            {
                name: "heptabase_export",
                description: "將特定白板上的所有卡片（包含一般卡片、PDF 內容）匯出為本地 Markdown 檔案並建立目錄索引。",
                inputSchema: {
                    type: "object",
                    properties: {
                        whiteboardId: {
                            type: "string",
                            description: "要匯出的目標白板 ID（可留空若提供 keyword）",
                        },
                        keyword: {
                            type: "string",
                            description: "若無 ID，可提供要查詢的白板名稱關鍵字",
                        },
                        outputDir: {
                            type: "string",
                            description: "匯出的本地資料夾絕對路徑。若不提供，預設放在專案的 export/ 資料夾",
                        },
                    },
                },
            },
            {
                name: "heptabase_domain",
                description: "同步單個領域 SOP Markdown 檔案至 Heptabase (包含 YAML Frontmatter 解析與額外標題前綴)。",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "本地的 Domain SOP Markdown 檔案絕對路徑",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "heptabase_domain_all",
                description: "批次同步目錄中的所有領域 SOP Markdown 檔案至 Heptabase。",
                inputSchema: {
                    type: "object",
                    properties: {
                        dirPath: {
                            type: "string",
                            description: "包含多個 Domain SOP 的資料夾絕對路徑",
                        },
                    },
                    required: ["dirPath"],
                },
            },
            {
                name: "heptabase_lessons",
                description: "從 GEMINI.md 中提煉並同步學習經驗段落至 Heptabase。",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "本地專案的 GEMINI.md 絕對路徑",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "heptabase_organize",
                description: "分析近期日記內容，並傳回方便 AI 分析整理用的 raw data。",
                inputSchema: {
                    type: "object",
                    properties: {
                        days: {
                            type: "number",
                            description: "要回顧的近期天數（預設 7 天）",
                        },
                    },
                },
            },
            {
                name: "heptabase_hub",
                description: "自動為特定主題產生 Hub 索引卡片，匯集多張白板的章節與卡片清單。",
                inputSchema: {
                    type: "object",
                    properties: {
                        topic: {
                            type: "string",
                            description: "主題關鍵字（例如：Dynamo, Python 等）",
                        },
                    },
                    required: ["topic"],
                },
            },
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    let cmdArgs: string[] = [];

    switch (name) {
        case "heptabase_import": {
            const { dirPath } = args as Record<string, string>;
            cmdArgs = ["import", dirPath];
            break;
        }
        case "heptabase_export": {
            const { whiteboardId, keyword, outputDir } = args as Record<string, string>;
            cmdArgs = ["export"];
            if (whiteboardId) {
                cmdArgs.push("--whiteboard-id", whiteboardId);
            } else if (keyword) {
                cmdArgs.push("--keyword", keyword);
            }
            if (outputDir) {
                cmdArgs.push("--output-dir", outputDir);
            }
            break;
        }
        case "heptabase_domain": {
            const { filePath } = args as Record<string, string>;
            cmdArgs = ["domain", filePath];
            break;
        }
        case "heptabase_domain_all": {
            const { dirPath } = args as Record<string, string>;
            cmdArgs = ["domain-all", dirPath];
            break;
        }
        case "heptabase_lessons": {
            const { filePath } = args as Record<string, string>;
            cmdArgs = ["lessons", filePath];
            break;
        }
        case "heptabase_organize": {
            const { days } = args as Record<string, number>;
            cmdArgs = ["organize"];
            if (days) cmdArgs.push("--days", days.toString());
            break;
        }
        case "heptabase_hub": {
            const { topic } = args as Record<string, string>;
            cmdArgs = ["hub", topic];
            break;
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }

    try {
        const result = await runSyncCommand(cmdArgs);
        return {
            content: [
                {
                    type: "text",
                    text: result,
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing command:\n${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// Start the server
async function start() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Heptabase Custom Tools MCP Server running on stdio");
}

start().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
