import path from "node:path";

export default function renderHome(req, res) {
    res.render(import.meta.dirname + "/views/home");
}