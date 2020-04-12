const { request } = require("https");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config();
const token = process.env.TOKEN;

let decifrado = "";

function Decrypt(phrase, number) {
  const alfabeto = "abcdefghijklmnopqrstuvwxyz";
  phrase.map((s) => {
    decifrado +=
      alfabeto.indexOf(s) >= 0
        ? alfabeto.indexOf(s) - number < 0
          ? alfabeto.charAt(alfabeto.indexOf(s) - number + 26)
          : alfabeto.charAt(alfabeto.indexOf(s) - number)
        : s;
  });
}

function WriteFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data), (err) => {
    if (err) return console.log(err);
  });
}

//request file
const req = request(
  `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`,
  (res) => {
    res.on("data", (d) => {
      const response = d;

      //save file
      WriteFile("answer.json", JSON.parse(response));

      //readind file contents
      fs.readFile("answer.json", "utf-8", (err, data) => {
        if (err) return console.log(`fail to read file: ${err}`);
        let contentFile = JSON.parse(data);

        const num = Number(contentFile.numero_casas);
        const cifrado = contentFile.cifrado.toLowerCase().split("");

        Decrypt(cifrado, num);
        contentFile.decifrado = decifrado;

        //cryptogrando using sha1
        contentFile.resumo_criptografico = crypto
          .createHash("sha1")
          .update(decifrado, "utf8")
          .digest("hex");
        WriteFile("answer.json", contentFile);
      });
    });
    res.setEncoding("utf8");
  }
);
req.on("error", (e) => {
  console.error(`erro:${e.message}`);
});
req.end();

//multipart/form-data
const form = new FormData();
form.append("answer", fs.createReadStream("answer.json"));

// send file
fetch(
  `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`,
  {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  }
)
  .then((res) => res.json())
  .then((json) => console.log(json));
