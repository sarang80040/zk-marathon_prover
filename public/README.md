# 🏃 ZK Marathon Verifier

A privacy-focused marathon-distance verification prototype built using
Zero-Knowledge Proofs (ZKPs), Circom, and Groth16.

The application reads a GPX activity file locally, calculates the
distance travelled, and generates and verifies a ZK proof in the
browser to demonstrate the marathon-distance condition without
uploading the GPX file to the server.

## ✨ Features

- **Privacy-focused:** GPX files and calculated distances stay in the
  browser during verification.
- **GPX parsing:** Reads GPS trackpoints from GPX XML files.
- **Distance calculation:** Calculates total distance using the
  Haversine formula.
- **Zero-Knowledge Proofs:** Uses Circom and Groth16 to demonstrate
  the marathon-distance condition.
- **Client-side proof generation:** Generates proofs in the browser
  using snarkjs.
- **Local proof verification:** Verifies proofs using a public
  verification key.
- **Input validation:** Rejects malformed GPX files and invalid
  coordinates.
- **Simple interface:** Displays whether the marathon-distance
  condition was satisfied.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML and CSS | Frontend interface |
| JavaScript | GPX parsing and distance calculation |
| Node.js | Local web server |
| Express.js | Serving frontend files |
| Circom | Writing the ZK circuit |
| snarkjs | Groth16 proof generation and verification |
| circomlib | Circuit comparison components |
| GPX | GPS activity data format |

## 🏗️ Architecture

1. The user selects a GPX file in the browser.
2. JavaScript parses the GPX file locally.
3. GPS trackpoints are used to calculate the total distance.
4. If the distance is below 42,195 metres, the application reports
   that the marathon-distance condition was not met.
5. Otherwise, snarkjs generates a Groth16 proof in the browser.
6. The browser verifies the proof using the verification key.
7. The interface displays the result.

The GPX file and calculated distance are not sent to the server by
this client-side verification flow. The server serves the application
and its public cryptographic assets.

## 🔐 The ZK Circuit

The circuit is implemented in `marathon.circom`.

It accepts a private distance input and exposes a public output
indicating completion.

The circuit checks the condition:

    distance >= 42195

The completion output is constrained to equal `1`, so witness
generation fails when the supplied distance is below the threshold.

The distance is private within the circuit, while the completion
output is public.

### Important distinction

The proof demonstrates that the circuit's condition holds for the
supplied distance. It does not independently prove that the distance
was calculated from authentic GPS data.

## 📁 Project Structure

    zk-marathon/
    ├── marathon.circom
    ├── marathon.r1cs
    ├── marathon.sym
    ├── marathon_final.zkey
    ├── verification_key.json
    ├── marathon_js/
    │   ├── generate_witness.js
    │   ├── marathon.wasm
    │   └── witness_calculator.js
    ├── public/
    │   ├── index.html
    │   ├── snarkjs.min.js
    │   └── zk/
    │       ├── marathon.wasm
    │       ├── marathon_final.zkey
    │       └── verification_key.json
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── README.md

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- Circom 2.x for rebuilding the circuit
- A modern browser

### 1. Clone the repository

    git clone <YOUR_REPOSITORY_URL>
    cd zk-marathon

### 2. Install dependencies

    npm install

### 3. Start the application

    node server.js

### 4. Open the application

Visit:

    http://localhost:3000

Select a GPX file and click **Verify activity**.

> The repository includes generated circuit artifacts for the
> educational demo, so the normal browser flow does not require
> rebuilding the circuit.

## 🧪 Testing

Test the application with:

- A malformed XML file renamed to `.gpx`.
- A valid GPX file with insufficient trackpoints.
- A valid GPX activity shorter than 42.195 km.
- A GPX activity meeting the distance threshold.
- Invalid GPS coordinates.

Expected results:

- Invalid GPX input is rejected.
- Activities below the threshold are rejected.
- Activities meeting the threshold proceed to proof generation.
- The success message is displayed only after successful proof
  verification.

## ⚠️ Limitations and Security Considerations

This is an educational prototype, not a production-grade marathon
certification system.

### 1. GPX authenticity

A user can fabricate or modify a GPX file. The application does not
currently authenticate the source of GPS activity data.

### 2. Distance calculation

Distance is calculated in JavaScript outside the ZK circuit.
The circuit does not independently validate the GPS coordinates
or recalculate the distance.

### 3. Activity type

A GPX file does not reliably establish whether the user ran,
cycled, walked, or used another mode of transport.

### 4. Browser-side trust

Users can modify client-side JavaScript or choose arbitrary proof
inputs. Consequently, a valid proof does not establish that a genuine
marathon was completed.

### 5. Trusted setup

The included Groth16 setup was created for educational use and
should not be used for production security claims.

### 6. Privacy scope

The application does not upload the GPX file or calculated distance
during the current client-side flow. The server still serves the
public circuit and proving assets, and this does not guarantee that
the activity data itself is authentic.

## 🔭 Future Improvements

- Authenticate activity data using trusted provider records/strava api
- Investigate signed activity attestations.
- Explore integrations with activity platforms where API access
  permits.
- Prove more of the distance calculation inside the ZK circuit.
- Improve circuit constraints and public/private input design.
- Add automated tests for GPX parsing and proof verification.
- Improve the setup ceremony and document reproducible builds.
- Support additional activity formats and verification providers.

## 📚 Learning Objectives

This project explores:

- Zero-Knowledge Proof fundamentals.
- Circom circuit development.
- Groth16 proof generation and verification.
- Private inputs and public outputs.
- Browser-based cryptographic computation.
- Privacy-preserving verification architecture.

## 📄 License

to be added