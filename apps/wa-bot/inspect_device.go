package main

import (
	"fmt"
	"reflect"
	"go.mau.fi/whatsmeow/store"
)

func main() {
	var d store.Device
	t := reflect.TypeOf(d)
	// fmt.Println("Fields of store.Device:")
	for i := 0; i < t.NumField(); i++ {
		// field := t.Field(i)
		// fmt.Printf("- %s (Type: %s)\n", field.Name, field.Type)
	}
}
