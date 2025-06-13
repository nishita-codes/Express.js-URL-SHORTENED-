import express from "express";
import { readFile,writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

import { fileURLToPath } from "url";

const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname,"data","links.json");

const app = express();

app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));

const loadLinks = async() =>{
  try{
    const data = await readFile(DATA_FILE,"utf-8");
    return JSON.parse(data);
  }catch(err){
    if(err.code === "ENOENT"){
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw err;
  }
}

const saveLinks = async (links) =>{
  await writeFile(DATA_FILE, JSON.stringify(links))
}
app.get("/", async (req,res)=>{
    try{
       const file = await readFile(path.join(__dirname,"views","index.html"));
       const links = await loadLinks();

       const content = file.toString().replaceAll("{{ shortened_url }}", Object.entries(links).map(([shortCode , url])=> `<li><a href="/${shortCode}" target="_blank">${req.host}/${shortCode}</a> -> ${url}
       </li>`)
        .join("")
      );
       return res.send(content);
    }catch(err){
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});

app.post("/", async(req,res)=>{
    try{
      const { url , shortCode } = req.body;
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      const links = await loadLinks();

      if(links[finalShortCode]){
        res.status(400)
        .send("Short code already exists.Please choose another.");
      }
      links[finalShortCode] = url;
      await saveLinks(links);
      return res.redirect("/");
    }catch(err){
      console.error(err);
      return res.status(500).send("Internal server error");
    }
});
app.get("/:shortCode", async (req,res)=>{
  try{
   const { shortCode } = req.params;
   const links = await loadLinks();

  if(!links[shortCode]) return res.status(404).send("404 error occured");

  return res.redirect(links[shortCode]);

  }catch(err){
    console.error(err);
      return res.status(500).send("Internal server error");
  }
});

app.listen(PORT,() =>{
  console.log(`Server running at https://localhost:${PORT}`);
});