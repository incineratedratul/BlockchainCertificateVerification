async function initialize() {
  try {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("Ethereum account access granted.");
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      console.log("Web3 detected.");
    } else {
      console.error(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  } catch (error) {
    console.error("Error during Web3 initialization:", error);
  }
}

initialize();

const contractAddress = "0x6671644Ae57B213a857fCc2517AB703589d06029"; // Replace with your contract address
const contractABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_username",
        type: "string",
      },
      {
        internalType: "string",
        name: "_issueDate",
        type: "string",
      },
      {
        internalType: "string",
        name: "_certificateName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_fullName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_institute",
        type: "string",
      },
      {
        internalType: "string",
        name: "_certificateType",
        type: "string",
      },
      {
        internalType: "string",
        name: "_certificateID",
        type: "string",
      },
      {
        internalType: "string",
        name: "_filename",
        type: "string",
      },
      {
        internalType: "string",
        name: "_verifier",
        type: "string",
      },
      {
        internalType: "string",
        name: "_verifierContact",
        type: "string",
      },
      {
        internalType: "string",
        name: "_ipfsCID",
        type: "string",
      },
    ],
    name: "addCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "cidToCertificate",
    outputs: [
      {
        internalType: "string",
        name: "username",
        type: "string",
      },
      {
        internalType: "string",
        name: "issueDate",
        type: "string",
      },
      {
        internalType: "string",
        name: "certificateName",
        type: "string",
      },
      {
        internalType: "string",
        name: "fullName",
        type: "string",
      },
      {
        internalType: "string",
        name: "institute",
        type: "string",
      },
      {
        internalType: "string",
        name: "certificateType",
        type: "string",
      },
      {
        internalType: "string",
        name: "certificateID",
        type: "string",
      },
      {
        internalType: "string",
        name: "filename",
        type: "string",
      },
      {
        internalType: "string",
        name: "verifier",
        type: "string",
      },
      {
        internalType: "string",
        name: "verifierContact",
        type: "string",
      },
      {
        internalType: "string",
        name: "ipfsCID",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_ipfsCID",
        type: "string",
      },
    ],
    name: "getCertificateByCID",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "username",
            type: "string",
          },
          {
            internalType: "string",
            name: "issueDate",
            type: "string",
          },
          {
            internalType: "string",
            name: "certificateName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fullName",
            type: "string",
          },
          {
            internalType: "string",
            name: "institute",
            type: "string",
          },
          {
            internalType: "string",
            name: "certificateType",
            type: "string",
          },
          {
            internalType: "string",
            name: "certificateID",
            type: "string",
          },
          {
            internalType: "string",
            name: "filename",
            type: "string",
          },
          {
            internalType: "string",
            name: "verifier",
            type: "string",
          },
          {
            internalType: "string",
            name: "verifierContact",
            type: "string",
          },
          {
            internalType: "string",
            name: "ipfsCID",
            type: "string",
          },
        ],
        internalType: "struct CertificateManager.Certificate",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_username",
        type: "string",
      },
    ],
    name: "getCertificatesByUsername",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "username",
            type: "string",
          },
          {
            internalType: "string",
            name: "issueDate",
            type: "string",
          },
          {
            internalType: "string",
            name: "certificateName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fullName",
            type: "string",
          },
          {
            internalType: "string",
            name: "institute",
            type: "string",
          },
          {
            internalType: "string",
            name: "certificateType",
            type: "string",
          },
          {
            internalType: "string",
            name: "certificateID",
            type: "string",
          },
          {
            internalType: "string",
            name: "filename",
            type: "string",
          },
          {
            internalType: "string",
            name: "verifier",
            type: "string",
          },
          {
            internalType: "string",
            name: "verifierContact",
            type: "string",
          },
          {
            internalType: "string",
            name: "ipfsCID",
            type: "string",
          },
        ],
        internalType: "struct CertificateManager.Certificate[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "usernameToCertificates",
    outputs: [
      {
        internalType: "string",
        name: "username",
        type: "string",
      },
      {
        internalType: "string",
        name: "issueDate",
        type: "string",
      },
      {
        internalType: "string",
        name: "certificateName",
        type: "string",
      },
      {
        internalType: "string",
        name: "fullName",
        type: "string",
      },
      {
        internalType: "string",
        name: "institute",
        type: "string",
      },
      {
        internalType: "string",
        name: "certificateType",
        type: "string",
      },
      {
        internalType: "string",
        name: "certificateID",
        type: "string",
      },
      {
        internalType: "string",
        name: "filename",
        type: "string",
      },
      {
        internalType: "string",
        name: "verifier",
        type: "string",
      },
      {
        internalType: "string",
        name: "verifierContact",
        type: "string",
      },
      {
        internalType: "string",
        name: "ipfsCID",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
let certificateManager;

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  console.log("Fetching certificates for username:", username);

  if (!window.web3) {
    console.error("Web3 is not initialized.");
    return;
  }

  try {
    certificateManager = new window.web3.eth.Contract(
      contractABI,
      contractAddress
    );
    console.log("Contract initialized:", certificateManager);

    const certificates = await certificateManager.methods
      .getCertificatesByUsername(username)
      .call();
    console.log("Certificates fetched:", certificates);
    displayResult(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    document.getElementById("result").innerText =
      "Error fetching certificates. Please check the username and try again.";
  }
});

function displayResult(certificates) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<h2>Certificates Details</h2>";
  if (certificates.length === 0) {
    resultDiv.innerHTML += "<p>No certificates found for this username.</p>";
  } else {
    certificates.forEach((cert) => {
      const certificateElement = document.createElement("div");
      certificateElement.innerHTML = `
        <p><strong>Username:</strong> ${cert.username}</p>
        <p><strong>Full Name:</strong> ${cert.fullName}</p>
        <p><strong>Certificate Name:</strong> ${cert.certificateName}</p>
        <p><strong>Institute:</strong> ${cert.institute}</p>
        <p><strong>Certificate Type:</strong> ${cert.certificateType}</p>
        <p><strong>Verification Status:</strong> Verified</p>
        <button class="request-access" data-username="${cert.username}" data-certificateid="${cert.certificateID}">Request Access</button>
        <hr />
      `;
      resultDiv.appendChild(certificateElement);
    });

    // Add event listeners for the buttons
    document.querySelectorAll(".request-access").forEach((button) => {
      button.addEventListener("click", (event) => {
        const username = event.target.getAttribute("data-username");
        const certificateID = event.target.getAttribute("data-certificateid");
        sendNotification(username, certificateID);
      });
    });
  }
}
