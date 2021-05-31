import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity } from 'react-native';
import db from '../config';
import {ScrollView} from 'react-native-gesture-handler';

export default class SearchScreen extends React.Component{

  constructor(props){
    super(props);
    this.state={
      allTransactions:[],
      lastVisibleTransaction:null,
      search:'',
    }
  }

  componentDidMount=async()=>{
    const query= await db.collection('transaction').limit(10).get();
    query.docs.map((doc)=>{
      this.setState({
        allTransactions: [...this.state.allTransactions,doc.data()],
        lastVisibleTransaction:doc
      })
    })
  }

  fetchMoreTransactions=async()=>{
    var enteredText=text.split("")
    var text=text.toUpperCase()

    if(enteredText[0].toUpperCase==='B'){
      const transaction=await db.collection("transactions").where('bookId', '==', text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions:[...this.state.allTransactions, doc.data()],
          lastVisibleTransaction:doc

        })
      })
    }
    else if(enteredText[0].toUpperCase==='S'){
      const transaction=await db.collection("transactions").where('studentId', '==', text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions:[...this.state.allTransactions, doc.data()],
          lastVisibleTransaction:doc

        })
      })
    }
  }
  searchTransactions=async(text)=>{
    var enteredText=text.split("")
    var text=text.toUpperCase()

    if(enteredText[0].toUpperCase==='B'){
      const transaction=await db.collection("transactions").where('bookId', '==', text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions:[...this.state.allTransactions, doc.data()],
          lastVisibleTransaction:doc

        })
      })
    }
    else if(enteredText[0].toUpperCase==='S'){
      const transaction=await db.collection("transactions").where('studentId', '==', text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions:[...this.state.allTransactions, doc.data()],
          lastVisibleTransaction:doc

        })
      })
    }
  }

  render(){
    return (
      <View style = {styles.container}>
      <View style = {styles.searchBar}>
        <TextInput
          placeholder = "enter book or student Id"
          style = {styles.bar}
          onChangeText={(text)=>{
            this.setState({
              search: text,
            })
          }}
        />
        <TouchableOpacity 
          style = {styles.searchButton} 
          onPress={()=>{
            this.searchTransactions(this.state.search)
          }}
        >
          <Text>search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
       data = {this.state.allTransactions}
       renderItem = {({item})=>(
         <View style = {{borderBottomWidth:2}}>
                <Text>{'bookId:'+ item.bookId}</Text>
                <Text>{'studentId:'+ item.studentId}</Text>
                <Text>{'Transaction type:'+ item.transactionType}</Text>
                <Text>{'Date:'+ item.date.toDate()}</Text>
          </View>
       )} 
       keyExtractor={(item, index)=>index.toString()}
       onEndReached={this.fetchMoreTransactions}
       onEndReachedThreshhold={0.7}
      >

      </FlatList>
      </View>
    )
  }
}


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 20
    },
    searchBar:{
      flexDirection:'row',
      height:40,
      width:'auto',
      borderWidth:0.5,
      alignItems:'center',
      backgroundColor:'grey',
  
    },
    bar:{
      borderWidth:2,
      height:30,
      width:300,
      paddingLeft:10,
    },
    searchButton:{
      borderWidth:1,
      height:30,
      width:50,
      alignItems:'center',
      justifyContent:'center',
      backgroundColor:'green'
    }
  })
