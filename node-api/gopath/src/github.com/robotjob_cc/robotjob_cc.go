package main

import (
	"encoding/json"
	"fmt"

	//"github.com/hyperledger/fabric/common/util"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type ry_PeopleInfo struct {
	PeopleId             string
	Name                 string
	Sex                  string
	Nation               string
	Age                  int
	CardID               string
	WorkType             int
	Isduty               int
	Household            string
	Residence            string
	MaritalStatus        int
	Education            int
	WorkYear             int
	Salary               int
	PeoplePhoto          string
	WorkAddress          string
	EducationExperience  string
	EducationExperience1 string
	WorkExperience       string
	WorkExperience1      string
	TrainingExperience   string
	TrainingExperience1  string
	Introduction         string
	AddDate              string //time
	UpdateTime           string //time
	ProfilePhoto         string
	Credit               float64 //=0
	IsVip                int     //bool=0
	ExpireTime           string  //time
	Signed               string
	Birthday             string
	Recommend            int
	SpecialCode          int
	Height               int     //=0
	Weight               int     //=0
	Account              float64 //=0
	LastLoginTime        string  //time
	IsDisturb            int     //bool=1
	IsForbid             int     //bool=0
}

func initPeopleInfo() ry_PeopleInfo {
	var newObj ry_PeopleInfo
	newObj.Credit = 0
	newObj.IsVip = 0
	newObj.Height = 0
	newObj.Weight = 0
	newObj.Account = 0
	newObj.IsDisturb = 1
	newObj.IsForbid = 0
	return newObj
}

/*func main() {
	var a ry_PeopleInfo = initPeopleInfo()
	a.PeopleId = "1"
	fmt.Println("helloworld!")
	fmt.Println(json.Marshal(a))

	var b ry_PeopleInfo = initPeopleInfo()
	var stri = `{"Name":"Joshua", "PeopleId":"001" ,"UpdateTime":"19901022"}`
	json.Unmarshal([]byte(stri), &b)
	fmt.Println(b)

}*/
type PeopleChainCode struct {
}

func (t *PeopleChainCode) Init(stub shim.ChaincodeStubInterface) pb.Response {

	return shim.Success(nil)
}
func (t *PeopleChainCode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "update" {
		return t.update(stub, args)
	} else if function == "query" {
		return t.query(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"invoke\" \"delete\" \"query\"")
}

func (t *PeopleChainCode) update(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	argStr := args[0]
	//argStr = `{"Name":"Joshua", "PeopleId":"001" ,"UpdateTime":"19901022"}`
	//输入参数校验
	/*if len(args) < 5 || len(args)%2 == 0 {
		return shim.Error("Incorrect number of arguments. Expecting Odd and >=5")
	}*/

	var peopleInfo ry_PeopleInfo = initPeopleInfo()
	err := json.Unmarshal([]byte(argStr), &peopleInfo)
	if err != nil {
		jsonResp := "{\"Error\":\"json ummarshal " + fmt.Sprint(argStr) + "\"}"
		return shim.Error(jsonResp)
	}

	peopleInfoByte, err := json.Marshal(peopleInfo)
	if err != nil {
		return shim.Error("build json failed!")
	}

	err = stub.PutState(peopleInfo.PeopleId, peopleInfoByte)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

// query callback representing the query of a chaincode
func (t *PeopleChainCode) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var PeopleId string // Entities
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the person to query")
	}

	PeopleId = args[0]

	// Get the state from the ledger
	peopleInfoByte, err := stub.GetState(PeopleId)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + PeopleId + "\"}"
		return shim.Error(jsonResp)
	}

	if peopleInfoByte == nil {
		jsonResp := "{\"Error\":\"Nil context for " + PeopleId + "\"}"
		return shim.Error(jsonResp)
	}

	/*var peopleInfo ry_PeopleInfo
	error := json.Unmarshal(peopleInfoByte, &peopleInfo)
	if error != nil {
		jsonResp := "{\"Error\":\"json ummarshal " + fmt.Sprint(peopleInfoByte) + "\"}"
		return shim.Error(jsonResp)
	}*/
	return shim.Success(peopleInfoByte)
}

func main() {
	err := shim.Start(new(PeopleChainCode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

