//
//  BaseBand.h
//  HotChip
//
//  Created by eminom on 13-5-25.
//
//

#ifndef _BASE_BAND_H_
#define _BASE_BAND_H_

#include "cocos2d.h"
#include <vector>
#include <map>


typedef void (*MapInitFuncPtr)();

template<class A,class M>
void fillCStructWithElement(const tinyxml2::XMLElement *element,A &stru,const M &_m){
    typedef typename M::value_type::second_type U;
    for(const tinyxml2::XMLAttribute *ar=element->FirstAttribute(); ar; ar=ar->Next()){
        const char *name = ar->Name();
        const char *value = ar->Value();
        typename M::const_iterator pos = _m.find(name);
        if( pos != _m.end() ){
            //printf("Assigning [%s]\n",name);
            const U& unit = pos->second;
            switch(unit.type){
                case 0:
                    stru.*(unit.pi) = atoi(value);
                    break;
                case 1:
                    stru.*(unit.di) = atof(value);
                    break;
                case 2:
                    stru.*(unit.si) = value;
                    break;
                case 3:
                    stru.*(unit.lli) = atoll(value);
                    break;
                default:
                    assert(false);
                    printf("Cannot assign to unknown type of %d\n",unit.type);
                    break;
            }
        } else {
            printf("Cannot assign field of [%s]\n",name);
        }
    }
}

template<class A, class M, class OT>
class XmlBasic{
public:
    typedef std::vector<int> KEY_SET;
    typedef std::map<int,A*> ITEM_CONTAINER_TYPE;

public:
    XmlBasic(const char *xml_path, const char *key_name, const M& _m, MapInitFuncPtr fptr)
        :xml_path_(xml_path)
        ,key_name_(key_name)
        ,m_(_m)
        ,init_func_ptr_(fptr){
    }
    
    ~XmlBasic(){
        clearAll();
    }

    virtual bool init(){
        init_func_ptr_();
        std::string path = cocos2d::CCFileUtils::sharedFileUtils()->fullPathForFilename(xml_path_.c_str());
        tinyxml2::XMLDocument doc;
        
        tinyxml2::XMLError err = doc.LoadFile(path.c_str());
        if( tinyxml2::XML_NO_ERROR != err ){
            printf("Error loading %s\n",xml_path_.c_str());
            return false;
        }
        
        printf("Start loading from XML(%s)....>>>\n",key_name_.c_str());
        tinyxml2::XMLElement *root = doc.RootElement();
        printf("<%s>\n",root->Name());
        
        for(tinyxml2::XMLNode *node=root->FirstChild();node;node=node->NextSibling()){
            const tinyxml2::XMLElement *ele = node->ToElement();
            if (!ele){
                continue;
            }
            
            if( !strcmp(ele->Name(), key_name_.c_str() ) ) {
                A * new_stru = new A();
                fillCStructWithElement(ele,*new_stru,m_);
                for(const tinyxml2::XMLNode *n1=ele->FirstChild();n1;n1=n1->NextSibling()){
                    const tinyxml2::XMLElement *ei = n1->ToElement();
                    if ( ei ){
                        OT::processElement(new_stru, ei);
                    }
                }
                insertWithNewItem(new_stru);
            }
        }
        
        printf("Loading end of XML(%s) (%lu items loaded).<<\n", xml_path_.c_str(), items_.size());
        return true;
    }
    
    const A* queryById(int id)const{
        typename std::map<int,A*>::const_iterator pos = items_.find(id);
        if( pos != items_.end() ){
            return pos->second;
        }
        return NULL;
    }
    
    void exportIds(KEY_SET &ks)const{
        ks.clear();
        typename ITEM_CONTAINER_TYPE::const_iterator pos = items_.begin();
        for(;pos!=items_.end();++pos){
            ks.push_back( pos->first );
        }
    }
    
    
private:
    void clearAll(){
        for(typename std::map<int,A*>::iterator pos=items_.begin();pos!=items_.end();++pos){
            delete pos->second;
        }
        items_.clear();
    }
    
protected:
    virtual void insertWithNewItem(A* new_stru) = 0;

protected:
    const ITEM_CONTAINER_TYPE& getItems()const{
        return items_;
    }
    ITEM_CONTAINER_TYPE& getItemsAccess(){
        return items_;
    }
    
private:
    const std::string xml_path_;
    const std::string key_name_;
    MapInitFuncPtr init_func_ptr_;
    const M& m_;
    ITEM_CONTAINER_TYPE items_;
};

#endif

