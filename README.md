This project consists of 2 parts in order to set up an AWS Contact Flow: `aws_connect.yml` and `serverless/serverless.yml`.

`aws_connect.yml` contains the cloudformation configuration resources to deploy the AWS Connect & Contact Flow instances.

`serverless/serverless.yml` deploys a lambda that contains the logic for generating the vanity phone numbers.

## Steps to Deploy

You will need both the [Serverless](https://www.serverless.com/framework/docs/getting-started) and [AWS](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) cli


  **First we will deploy the serverless lambda function + dynamodb stack:**
  
    npm i
    
    cd serverless
    
    serverless deploy --aws-profile {your-aws-profile-name}
  You can omit the `--aws-profile` flag to use the default account configured through `aws configure`

  **When this is completed, we can move on to deploy the AWS Connect + Contact Flow Stack**
   
    cd ..
    
    aws cloudformation create-stack \
    --stack-name TTECConnectStack \
    --template-body file://aws_connect.yml \
    --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --profile {your-aws-profile-name}
    
  *again, you can choose to omit the `--profile` flag here.*

  This stack will generate a Phone Number that can be reached to start the Contact Flow. In order to get the phone number, go to the **AWS Console -> CloudFormation** and select the `TTECConnectStack`
  From there, go to `Outputs` and the PhoneNumber will be visible:

  <img width="861" alt="image" src="https://github.com/adrielarce/aws-connect-contact-flow/assets/47565489/8d55dbee-7f58-41c8-b8a9-643f1e4e01d7">

Once all the resources have been created, you can call the number and it will generate 3 vanity phone numbers based on your phone number. The full list of 5 vanity numbers will be stored in a DynamoDB Table: `PhoneNumbers`.

*Note, this project assumes that you have all the permissions on your AWS account to create the resources defined in the project.



## Project Background
The goal for this project was to simplify and automate the deployment of an AWS Contact Flow as much as possible. Initially I would have liked to contain all resources into a single CloudFormation template file, `aws_contact.yml`, and be able to deploy everything with one command, however I came about a hurdle when I needed to create a lambda with third-party dependancies. Therefore, I chose to create a seperate Serverless stack where I can package the lambda and its dependancies with webpack and deploy using the Serverless framework.
With some more time, I would have loved to create the support for different environments, e.g. `dev` `staging`, and `prod`. I would also have liked to improve the Vanity Number generator lambda with a better algorithm, and add some testing suites as well.


