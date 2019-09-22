import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../entity/User";

class UserController {

  static listAll = async (req: Request, res: Response) => {
    //Get users from database
    const userRepository = getRepository(User);
    try {

      const users = await userRepository.find({
        select: ["id", "username", "role"] //We dont want to send the passwords on response
      });
      //Send the users object
      res.send(users);
    } catch{
      res.status(404).send({success:false, message: 'No user record found.'})
    }


  };

  static getOneById = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id: number = parseInt(req.params.id);

    //Get the user from database
    const userRepository = getRepository(User);
    try {
      const user = await userRepository.findOneOrFail(id, {
        select: ["id", "username", "role"] //We dont want to send the password on response
      });
      res.send({ success: true, ...user });
    } catch (error) {
      res.status(404).send({ success: false, message: "User not found" });
    }
  };

  static newUser = async (req: Request, res: Response) => {
    //Get parameters from the body
    let { username, password, role } = req.body;
    let user = new User();
    user.username = username;
    user.password = password;
    user.role = role;

    //Validade if the parameters are ok
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    //Hash the password, to securely store on DB
    user.hashPassword();

    //Try to save. If fails, the username is already in use
    const userRepository = getRepository(User);
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send({ success: false, message: "username already in use" });
      return;
    }

    //If all ok, send 201 response
    res.status(201).send({ success: true, message: "User created" });
  };

  static editUser = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id = req.params.id;

    //Get values from the body
    const { username, role } = req.body;

    //Try to find user on database
    const userRepository = getRepository(User);
    let user;
    try {
      user = await userRepository.findOneOrFail(id);
    } catch (error) {
      //If not found, send a 404 response
      res.status(404).send({ success: false, message: "User not found" });
      return;
    }

    //Validate the new values on model
    user.username = username;
    user.role = role;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    //Try to safe, if fails, that means username already in use
    try {
      const updated = await userRepository.save(user);
       //After all send a 204 (no content, but accepted) response
       console.log('updated', updated)
       if(updated){
         res.status(200).send({success: true, message: "User updated."});
       }
    } catch (e) {
      res.status(409).send("username already in use");
      return;
    }
   
  };

  static deleteUser = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id = req.params.id;

    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail(id);
      console.log('User found...', user);
      if(user){

        let deleted = await userRepository.delete(id);
        console.log("I am deleted...", deleted);
        //After all send a 204 (no content, but accepted) response
        if(deleted){
          res.status(200).send({ success: true, message: 'User deleted successfullly.'});
        }
      }
    } catch (error) {
      res.status(404).send({ success: false, message: "User not found" });
      return;
    }
   
  };
};

export default UserController;