const AWS = require("aws-sdk");
const words = require("an-array-of-english-words");

exports.handler = async (event, context, callback) => {
  console.log("🚀 ~ exports.handler= ~ context:", context);
  console.log("🚀 ~ exports.handler= ~ event:", event);
  AWS.config.update({ region: "us-east-1" });
  //   console.log("🚀 ~ words:", words);

  const dynamoClient = new AWS.DynamoDB.DocumentClient();

  try {
    const callerPhoneNumber = event.Details.Parameters.CallerPhoneNumber || event.CallerPhoneNumber; // Get the caller's phone number
    console.log("event", event);
    console.log("contact", event.Details.Parameters.CallerPhoneNumber);

    const processedNumber = validateNumber(callerPhoneNumber);

    // We will initially attempt to create a vanity number with all 7 non-areacode phone digits
    // If none are initially found, we will reduce the number of digits to use by 1.
    let sliceSize = 7; // Initial slice size
    let vanityList = [];

    while (sliceSize > 3) {
      vanityList = [...vanityList, ...generateVanityNumbers(processedNumber, sliceSize)];

      if (vanityList.length > 5) {
        break; // Exit the loop if vanityList has 5 or more elements
      } else {
        sliceSize--; // Decrease the slice size for the next iteration
      }
    }
    if (vanityList.length < 5) {
      const vanityForLast4 = await generateVanityNumbersForLast4(processedNumber, 5 - vanityList.length);
      vanityList = [...vanityList, ...vanityForLast4];
    }
    console.log("🚀 ~ exports.handler= ~ vanityList:", vanityList);

    // Save the 5 vanity numbers associated with the callers phone number
    await save(processedNumber, vanityList, dynamoClient);

    const finalVanityList = vanityList.slice(0, 3);

    // Stringify the vanity phone numbers array
    const lastElement = finalVanityList.pop();
    const resultString = finalVanityList.join(", ") + ", and " + lastElement;

    const status = "Success!";
    console.log(status);
    return { status, text: `Your vanity numbers are ${resultString}. Thank you for calling.` };
  } catch (err) {
    console.log("🚀 ~ exports.handler= ~ err:", err);
    const status = "Failure!";
    console.log(status);
    console.log(err);
    callback(err);
    return status;
  }
};

const validateNumber = (number) => {
  const validPhoneNumber = /^(\+1|1)?\d{10}$/;

  if (!number) {
    throw Error("Phone number was null or undefined.");
  }

  if (!number.match(validPhoneNumber)) {
    throw Error("Invalid phone number.");
  }

  return processNumber(number);
};

const processNumber = (number) => {
  const validPhoneNumber = /^(\+1|1)?(\d{10})$/;

  return number.replace(validPhoneNumber, "$2");
};

const ALPHAS = ",,abc,def,ghi,jkl,mno,pqrs,tuv,wxyz".split(",").map((a) => [...a]);
function generateVanityNumbers(numStr, numStrLength) {
  let phoneNumber = numStr.slice(-numStrLength);
  const parsedNumStr = longestSubstringWithoutZeroOrOne(phoneNumber);
  console.log("🚀 ~ generateVanityNumbers ~ parsedNumStr:", parsedNumStr);
  const alphas = ALPHAS; // local scope reference for shallower scope search
  const nums = [...parsedNumStr[1]].map(Number);
  const res = [];
  const count = nums.length - 1;
  (function combine(n, cur) {
    if (n === count) {
      for (const char of alphas[nums[n]]) {
        // console.log("🚀 ~ combine ~ cur + char:", cur + char);
        if (words.includes(cur + char)) res.push(numStr.slice(0, -numStrLength) + parsedNumStr[0] + cur.toUpperCase() + char.toUpperCase() + parsedNumStr[2]);
      }
    } else {
      for (const char of alphas[nums[n]]) {
        combine(n + 1, cur + char);
      }
    }
  })(0, "");
  return res;
}

function longestSubstringWithoutZeroOrOne(str) {
  let currentSubstring = "";
  let longestSubstring = "";
  let leftDigits = "";
  let rightDigits = "";

  for (const char of str) {
    if (char !== "0" && char !== "1") {
      currentSubstring += char;
    } else {
      if (currentSubstring.length > longestSubstring.length) {
        longestSubstring = currentSubstring;
        leftDigits = str.substring(0, str.indexOf(longestSubstring));
        rightDigits = str.substring(str.indexOf(longestSubstring) + longestSubstring.length);
      }
      currentSubstring = "";
    }
  }

  // Check the last substring
  if (currentSubstring.length > longestSubstring.length) {
    longestSubstring = currentSubstring;
    leftDigits = str.substring(0, str.indexOf(longestSubstring));
    rightDigits = str.substring(str.indexOf(longestSubstring) + longestSubstring.length);
  }

  return [leftDigits, longestSubstring, rightDigits];
}

const generateVanityNumbersForLast4 = async function (number, numberToGenerate) {
  let vanityList = [];

  const firstSix = number.slice(0, 6);
  const lastFour = number.slice(6).split("");

  const dialPadMap = new Map([
    ["0", "0"],
    ["1", "1"],
    ["2", "ABC"],
    ["3", "DEF"],
    ["4", "GHI"],
    ["5", "JKL"],
    ["6", "MNO"],
    ["7", "PQRS"],
    ["8", "TUV"],
    ["9", "WXYZ"]
  ]);

  const spotOneStr = dialPadMap.get(lastFour[0]).split("");
  const spotTwoStr = dialPadMap.get(lastFour[1]).split("");
  const spotThreeStr = dialPadMap.get(lastFour[2]).split("");
  const spotFourStr = dialPadMap.get(lastFour[3]).split("");

  for (let i = 0; i < spotOneStr.length; i++) {
    if (vanityList.length >= 10) {
      // list already contains 5 words
      break;
    }

    for (let j = 0; j < spotTwoStr.length; j++) {
      if (vanityList.length >= 10) {
        // list already contains 5 words
        break;
      }

      for (let k = 0; k < spotThreeStr.length; k++) {
        if (vanityList.length >= 10) {
          // list already contains 5 words
          break;
        }

        for (let m = 0; m < spotFourStr.length; m++) {
          if (vanityList.length >= 10) {
            // list already contains 5 words
            break;
          }

          const phoneWord = spotOneStr[i] + spotTwoStr[j] + spotThreeStr[k] + spotFourStr[m];
          const vanityNumber = firstSix + phoneWord;
          if (vanityList.length < 5) {
            // take the first 5 permutations (or fewer if lastFour is e.g. 1111)
            vanityList.push(vanityNumber);
          } else if (words.includes(phoneWord.toLowerCase())) {
            // will add up to the first five matches in the dictionary
            vanityList.push(vanityNumber);
          }
        }
      }
    }
  }

  vanityList = vanityList.slice(0, numberToGenerate);

  return vanityList;
};

const save = async (number, vanityList, dynamoClient) => {
  const updateParams = {
    TableName: "PhoneNumbers",
    Key: {
      PhoneNumber: number
    },
    UpdateExpression: "SET VanityNumbers = :vanityList",
    ExpressionAttributeValues: {
      ":vanityList": vanityList
    }
  };

  await dynamoClient.update(updateParams).promise();
};
