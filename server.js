const express = require("express");
const multer = require("multer");
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const app = express();
const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 10 * 1024 * 1024 }
});

const execFileAsync = promisify(execFile);
const PORT = 3000;

app.use(express.static("public"));

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = angle => angle * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(a));
}

function calculateDistance(points) {
    let total = 0;

    for (let i = 1; i < points.length; i++) {
        total += haversine(
            Number(points[i - 1]["@_lat"]),
            Number(points[i - 1]["@_lon"]),
            Number(points[i]["@_lat"]),
            Number(points[i]["@_lon"])
        );
    }

    return Math.round(total);
}

function extractTrackPoints(gpx) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });

    const parsed = parser.parse(gpx);
    const tracks = parsed.gpx?.trk;
    const trackList = Array.isArray(tracks)
        ? tracks
        : tracks ? [tracks] : [];

    const points = [];

    for (const track of trackList) {
        const segments = track.trkseg
            ? Array.isArray(track.trkseg)
                ? track.trkseg
                : [track.trkseg]
            : [];

        for (const segment of segments) {
            const segmentPoints = segment.trkpt
                ? Array.isArray(segment.trkpt)
                    ? segment.trkpt
                    : [segment.trkpt]
                : [];

            points.push(...segmentPoints);
        }
    }

    if (points.length < 2) {
        throw new Error("GPX must contain at least two trackpoints.");
    }

    for (const point of points) {
        const lat = Number(point["@_lat"]);
        const lon = Number(point["@_lon"]);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 || lat > 90 ||
            lon < -180 || lon > 180
        ) {
            throw new Error("GPX contains invalid GPS coordinates.");
        }
    }

    return points;
}

async function generateProof(distance) {
    const inputPath = path.join(__dirname, "input.json");
    const witnessPath = path.join(__dirname, "witness.wtns");
    const proofPath = path.join(__dirname, "proof.json");
    const publicPath = path.join(__dirname, "public.json");

    fs.writeFileSync(
        inputPath,
        JSON.stringify({ distance: String(distance) })
    );

    const snarkjs = path.join(
        __dirname,
        "node_modules",
        ".bin",
        "snarkjs"
    );

    await execFileAsync(
        process.execPath,
        [
            path.join(__dirname, "marathon_js", "generate_witness.js"),
            path.join(__dirname, "marathon_js", "marathon.wasm"),
            inputPath,
            witnessPath
        ]
    );

    await execFileAsync(snarkjs, [
        "groth16", "prove",
        path.join(__dirname, "marathon_final.zkey"),
        witnessPath,
        proofPath,
        publicPath
    ]);

    const { stdout } = await execFileAsync(snarkjs, [
        "groth16", "verify",
        path.join(__dirname, "verification_key.json"),
        publicPath,
        proofPath
    ]);

    return stdout.includes("OK!");
}

app.post("/verify", upload.single("gpx"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: "Please upload a GPX file."
        });
    }

    try {
        const gpx = fs.readFileSync(req.file.path, "utf8");
        const points = extractTrackPoints(gpx);
        const distance = calculateDistance(points);

        // Reject implausibly large distances for this demo.
        if (distance > 1000000) {
            throw new Error("Activity distance is outside the supported range.");
        }

        if (distance < 42195) {
            return res.json({
                completed: false,
                distance,
                message: "This activity is shorter than a full marathon."
            });
        }

        const verified = await generateProof(distance);

        if (!verified) {
            throw new Error("ZK proof verification failed.");
        }

        return res.json({
            completed: true,
            message: "Full-marathon distance condition proven."
        });
    } catch (error) {
        console.error(error.message);

        return res.status(400).json({
            error: "Could not verify this GPX file. Check the file and try again."
        });
    } finally {
        fs.unlink(req.file.path, () => {});
    }
});

app.listen(PORT, () => {
    console.log(`ZK Marathon running at http://localhost:${PORT}`);
});