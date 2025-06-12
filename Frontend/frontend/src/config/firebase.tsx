import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Button, PressEvent } from "@heroui/button";
import { Form, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@heroui/react";
import { Input } from "@heroui/input";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { useState } from "react";
const firebaseConfig = {
  apiKey: "AIzaSyC1TyBaoI10D2jIx_P0xS4nUwy9qL4Jvao",
  authDomain: "code1v1authentication.firebaseapp.com",
  projectId: "code1v1authentication",
  storageBucket: "code1v1authentication.firebasestorage.app",
  messagingSenderId: "726688198821",
  appId: "1:726688198821:web:5d44dbd27681ab43335d4c",
  measurementId: "G-6WL9EF80FN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const genders = [
  {key: "m", label: "Male"},
  {key: "f", label: "Female"}
]


const CreateUserForm = () => {

  return (
    <Form onSubmit = {createUser}>
      <Input isRequired label="Email" name = "email" labelPlacement="inside"></Input>
      <Input isRequired label = "Password" name = "password" labelPlacement="inside" type = "password">Password</Input>
      <Select isRequired label = "Gender" name = "gender" labelPlacement="inside">{genders.map((gender) => <SelectItem key = {gender.key}>{gender.label}</SelectItem>)}</Select>
      <Button type = "submit">
        Submit
      </Button>
    </Form>
  )
}

const UserSignInForm = () => {
  return (
    <Form onSubmit = {signInUser}>
      <Input isRequired label="Email" name = "email" labelPlacement="inside"></Input>
      <Input isRequired label = "Password" name = "password" labelPlacement="inside" type = "password">Password</Input>
      <Button type = "submit">
        Submit
      </Button>
    </Form>
  )
}

const createUser = async (e: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  console.log(data);

  const email = data["email"]?.toString() ?? "";
  const password = data["password"]?.toString() ?? "";
  const gender = data["gender"]?.toString() ?? "";

  const userCredential = await createUserWithEmailAndPassword(auth, email, password) 
  const uid = userCredential.user.uid;

  // saving to firestore because of extra data like gender doesnt get stored with userAuth
  await setDoc(doc(db, "users", uid), {
    email, gender
  })

}

const signInUser = async (e: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; })  => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  
  const email = data["email"]?.toString() ?? "";
  const password = data["password"]?.toString() ?? "";
  signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    const user = userCredential.user;
  }).catch(
    (error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    }
  )
}

export const CreateUserButton = () => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  return (<><Button onPress={onOpen}>
    Create User
  </Button>
  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose: ((e: PressEvent) => void) | undefined) => (
            <>
              <ModalHeader>User Registration</ModalHeader>
              <ModalBody>
                <CreateUserForm />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      </>)
}

export const SignInButton = () => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  return (
      <>
      <Button onPress={onOpen}>
        Sign In
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose: ((e: PressEvent) => void) | undefined) => (
              <>
                <ModalHeader>User Registration</ModalHeader>
                <ModalBody>
                  <UserSignInForm />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    Action
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        </>
      )
}

export const SignOutButton = () => {
  const signOutFcn = async () => {await signOut(auth);}

  return <Button onPress={signOutFcn}>Sign Out</Button>
}

export const CheckAuthStatus = () => {
  const [signedIn, setSignedIn] = useState(false)
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setSignedIn(true)
    } else {
      setSignedIn(false)
    }
  })
  if (signedIn) {
    return <SignOutButton />
  } else {
    return <SignInButton />
  }
} 