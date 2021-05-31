import React from 'react';
import { Text, Alert, View, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from "../config.js"

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        buttonState: 'normal',
        scannedStudentId: '',
        transactionMessage: '',
      }
    }

  getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
  }

  handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state
      if(buttonState === 'BookId'){
        this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal'
        });
      }
      else if(buttonState === 'StudentId'){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal',
        })
      }
      
  }

  initiateBookIssue=async()=>{
      //add a transaction
      db.collection("transaction")
      .add({
          'studentId': this.state.scannedStudentId,
          'bookId':this.state.scannedBookId,
          'transactionType': 'Issue',
          'date': firebase.firestore.Timestamp.now().toDate()
      })    
      
      //change book status
      db.collection("books")
      .doc(this.state.scannedBookId)
      .update({
        'bookAvailability':false
      })
      //change the number of books issued by student
      db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        'booksIssued': firebase.firestore.FieldValue.increment(1)
      })
    }

    initiateBookReturn=async()=>{
      //add a transaction
      db.collection("transaction")
      .add({
          'studentId': this.state.scannedStudentId,
          'bookId':this.state.scannedBookId,
          'transactionType': 'Return',
          'date': firebase.firestore.Timestamp.now().toDate()
      })    
      
      //change book status
      db.collection("books")
      .doc(this.state.scannedBookId)
      .update({
        'bookAvailability':true
      })
      //change the number of books issued by student
      db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        'booksIssued': firebase.firestore.FieldValue.increment(-1)
      })

    }

  checkBookEligibility=async()=>{
    const bookRef=await db.collection('books').where('bookId','==',this.state.scannedBookId).get()
    var transactionType=''
    if(bookRef.docs.length==0){
      transactionType=false
      console.log("Book is not present in the databse")
    }
    else{
      bookRef.docs.map((doc)=>{
        var book=doc.data()
          if(book.bookAvailability){
            transactionType='Issue'
          }
          else{
            transactionType='Return'
          }
      })
    }
    return transactionType
  }

  checkEligibilityForBookIssue=async()=>{
    const studentRef= await db.collection('students').where('studentId','==',this.state.scannedStudentId).get()
    var isStudentEligible = ''
    if(studentRef.docs.length==0){
      isStudentEligible=false
      this.setState({
        scannedStudentId:'',
        scannedBookId:'',
      })
      //Alert.alert("Student not found in the database");
      console.log("Student not found in the database");
    }
    else{
      studentRef.docs.map((doc)=>{
        var student = doc.data()
        if(student.booksIssued<2){
          isStudentEligible=true
        }
        else{
          isStudentEligible=false
          //Alert.alert("Student has already issued 2 books")
          console.log("Student has already issued 2 books")
          this.setState({
            scannedStudentId:'',
            scannedBookId:'',
          })
        }
      })
    }
    return isStudentEligible
  }
  checkEligibilityForBookReturn=async()=>{
    const transactionRef = await db.collection('transaction').where('bookId',"==",this.state.scannedBookId).limit(1).get()
    var isStudentEligible=''
    transactionRef.docs.map((doc)=>{
      var lastBookTransaction = doc.data()
      if(lastBookTransaction.studentId === this.state.scannedStudentId){
        isStudentEligible=true
        Alert.alert("student verified")
      }
      else{
        isStudentEligible=false
        //Alert.alert("The book was not issued by the student")
        console.log("The book was not issued by the student")
      }
    })
    return isStudentEligible
  }
  handleTransaction=async()=>{
   var transactionType=await this.checkBookEligibility();
   if(!transactionType){
     //Alert.alert("Sorry! book not found in the db")
      console.log("Sorry! book not found in the db");

     this.setState({
       scannedBookId: '',
       scannedStudentId: '',
     })
   }
   else if(transactionType === 'Issue'){
     //check that the student is eligible or not to issue the book
     var isStudentEligible = await this.checkEligibilityForBookIssue()
     if(isStudentEligible){
       this.initiateBookIssue()
       //Alert.alert("Book issued to the student");
       console.log("Book issued to the student")
     }
   }
   else{
     //chck whether the student is eligible for book return or not
     var isStudentEligible = await this.checkEligibilityForBookReturn()
     if(isStudentEligible){
       this.initiateBookReturn()
        //Alert.alert("Book returned to the library");
        console.log("Book returned to the library")
     }
   }
  }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
            <View>
              <Image
                source = {require('../assets/mainBook.jpg')}
                style = {{width:200, height:200}}
              />
              <Text>Wily App</Text>
            </View>
            <View style={styles.inputView}>
              <TextInput
                placeholder = "Book ID"
                onChangeText={text=>{this.setState({scannedBookId:text})}}
                value = {this.state.scannedBookId}
              />
              <TouchableOpacity 
                style={styles.scanButton} 
                onPress = {()=>{
                  this.getCameraPermissions('bookId')
                }}
              >
                <Text> Scan Book ID</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputView}>
              <TextInput
                placeholder = "Student ID"
                onChangeText={text=>{this.setState({scannedStudentId: text})}}
                value = {this.state.scannedStudentId}
              />
              <TouchableOpacity
               style={styles.scanButton}
               onPress= {()=>{
                 this.getCameraPermissions('studentId')
               }}
              >
                <Text> Scan Student ID</Text>
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity
               style = {styles.submitButton}
               onPress={async()=>{
                 console.log("Hey")
                 this.handleTransaction();
                 this.setState({
                  scannedBookId:'',
                  scannedStudentId:''
                 })
               }}>
               
                <Text> Submit </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 20,
    },
    inputView:{
      flexDirection:'row',
      margin:20
    },
    submitButton:{
      backgroundColor: 'yellow',
      padding: 10,
      margin: 10
    }
  });