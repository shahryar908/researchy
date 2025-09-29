import express,{ type Request,type Response} from 'express';
import 'dotenv/config';
import { clerkMiddleware,requireAuth,getAuth,clerkClient } from '@clerk/express';


const app=express();


app.use(clerkMiddleware());

app.get("/protected",requireAuth(),async (req:Request,res:Response)=>{
    
    
    try{

    const userid=getAuth(req);
    if (!userid.userId) {
        return res.status(401).send("Unauthorized");
    }
    const user = await clerkClient.users.getUser(userid.userId!);
    console.log(user);
    res.json(
        { 
            message: 'Protected data accessed',
            user: {
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
            }}
    );
    }
    catch(err){
        console.log(err);
    }
});


app.get("/", (req:Request, res:Response) => {
    res.send("Hello World");
});

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})